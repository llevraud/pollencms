<?php
if (isset($_POST["PHPSESSID"])) {
	session_id($_POST["PHPSESSID"]);
}
session_start();
include '../config.inc.php';
require(SITE_PATH.'core/lib/lib_functions.php');
require (SITE_PATH.'core/lib/lib_error.php');

if(isset($_REQUEST['action']) && $_REQUEST['action']=="ajaxgettext"){
	require SITE_PATH.'core/lib/pollencms.php';
	ajaxgettext();
}
else { if( isConnected() ){
	
	if(isset($_GET['action']) || isset($_POST['action'])){
		
		require SITE_PATH.'core/lib/pollencms.php';
		require SITE_PATH.'core/lib/pfile.php';
		require SITE_PATH.'core/lib/ppage.php';
		require SITE_PATH.'core/lib/plink.php';
		require SITE_PATH.'core/lib/pimage.php';
		
		$action = (isset($_GET['action'])?$_GET['action']:$_POST['action']);
		switch($action){
			default:
				/**
				 * savefile,resizeimage, createlink, deletefile, createfile, copyfile,movefile, setpageconfigvar, savepage,
				 * savesiteconfig, toggleactivateplugin, sortfiles, ajaxgettext,renamefile, loadhistorypage, upload, createdir, clearcache
				 */
				if(function_exists($action)){
					if(!call_user_func($action))
						printFatalHtmlError();
				}else{					
					printFatalHtmlError('Action Unknown');			
				}
			break;
		}			
	}else{
		printFatalHtmlError('Internal error, action must me defined');
	}

}//must be connected;
else{printFatalHtmlError('You are not connected',505);}
die();
}

function toggleactivateplugin(){
	global $configFile;
	if(!isset($_REQUEST["plugin"]) || !isset($_REQUEST["value"]))
		setError('Internal Error in togleactivateplugin');
	
	$strPluginName = urljsdecode($_REQUEST["plugin"]);
	$strValue = urljsdecode($_REQUEST["value"]);
	$oPluginDir = new PPluginDir(PLUGINS_DIR.SLASH.$strPluginName);
	if(!$oPluginDir->isDir())
		return setError(sprintf(_('Can not find the plugin %s'),$strPluginName));
	
	if(!$oPluginDir->toggleActivate(true))
		return false;

	if($strValue == "true")
		echo sprintf(_('Plugin %s is activated'),$oPluginDir->getPluginName());
	else
		echo sprintf(_('Plugin %s is unactivated'),$oPluginDir->getPluginName(),true);
	
	return true;
}

/**
 * SavePage
 * 
 * @return true if succeed, else return false
 */
function savepage(){
	if(!isset($_REQUEST["file"]) || $_REQUEST["file"]=="" || eregi("\.\.",$_REQUEST["file"])) {
		return setError(_("You should specified a file to save"));
	}
	$pfile = &getFileObject(SITE_PATH.urljsdecode($_REQUEST["file"]));
	if(!$pfile)
		return setError('Internal Error, can not save page, file not found.');

	if(isset($_REQUEST["textConfig"])){
		if(!$pfile->Save($_REQUEST["text"], $_REQUEST["textConfig"]))
			return false;
	}else {
		if(!$pfile->Save($_REQUEST["text"]))
			return false;
	}
	echo _('Page has been saved.');
	return true;
}

function savefile(){
	if(!isset($_REQUEST["file"]) || $_REQUEST["file"]=="" || eregi("\.\.",$_REQUEST["file"])) {
		return setError(_("You should specified a file to save"));
	}

	$pfile = &getFileObject(SITE_PATH.urljsdecode($_REQUEST["file"]));
	if(!$pfile)
		return setError('Internal Error, can not save file, file not found.');
	if(!$pfile->Save($_REQUEST['text']))
		return false;
	echo _('File saved successfully.');
	return true;
}

function saveconfigfile(){
	if(!isset($_REQUEST["file"]) || $_REQUEST["file"]=="" || eregi("\.\.",$_REQUEST["file"])) {
		return setError(_("You should specified a file to save"));
	}
	if(!isset($_REQUEST["text"])) {
		return setError('Internal error, text is not set');
	}
	if(!isset($_REQUEST["section"])) {
		return setError('Internal error, section is not set');
	}
	if( !($pConfigFile = &getFileObject(SITE_PATH.urljsdecode($_REQUEST["file"]))) )
		return setError('Internal Error, can not save file, file not found.');

	$strSection = 	$_REQUEST["section"];
	if($strSection){
		$tabSection = &$pConfigFile->parseIniFromString(stripslashes($_REQUEST["text"]));
		$tabParams = $pConfigFile->getTabParams();
		$pConfigFile->tabParams = array_merge($tabParams,array($strSection=>$tabSection));
		if(!$pConfigFile->Save())
			return false;
	}
	else if(!$pConfigFile->Save($_REQUEST['text']))
		return false;
	
	echo _('File saved successfully.');
	return true;
}

function savesiteconfig(){
	if(!isset($_REQUEST['text']))
		return setError('Internal Error in savesiteconfig.text is not defined');
	
	$strText = stripslashes($_REQUEST['text']);
	$oIniFileTmp = new PConfigfile(CACHE_DIR.'tmpconfig.ini');
	
	if(!$oIniFileTmp->Save($strText))
		return false;
	if(!$oIniFileTmp->parse())
		return false;
	$tabNewParams = $oIniFileTmp->getTabParams();
	$oIniFileTmp->Delete();
	
	global $configFile;
	foreach($tabNewParams as $k=>$v){
		$configFile->setParam($k,$v);
	}
	if(!$configFile->Save())
		return false;
	
	echo _("Site configuration has been saved !");
	return true;
}

function upload(){
	if(!wrapupload())
		printError();
	return true;
}
function wrapupload(){
	if( !isset($_POST['CURRENT_DIR']) )
		return setError('Internal error, CURRENT_DIR is not set');
	$strCurrDir = urldecode($_POST['CURRENT_DIR']);
	
	if( !($oDir = &getFileObject(SITE_PATH.SLASH.$strCurrDir)) || !is_dir($oDir->path) )
	 return setError(sprintf(_('Internal error, directory %s not exists.'),$strCurrDir)); 

	if( !$oDir->uploadFile($_FILES, 'Filedata') )
		return false;
	
	$oFileUploaded = &getFileObject($oDir->path.SLASH.$oDir->getUnixName($_FILES['Filedata']['name']));
	if($oFileUploaded && $oFileUploaded->is_image()){
	  	if( !$oFileUploaded->createThumb(70) )
	  		return false;
		if( !$oFileUploaded->createThumb(480, false) )
			return false;
	}
	if($oFileUploaded && !doEventAction('uploadfile',array(&$oFileUploaded)))
		return false;
	sleep(4);
	echo 'OK';
	return true;
}

function createdir(){
	if( !isset($_POST['CURRENT_DIR']) )
		return setError('Internal error, CURRENT_DIR is not set');
	$strCurrDir = urljsdecode($_POST['CURRENT_DIR']);
	if( !($oDir = &getFileObject(SITE_PATH.$strCurrDir)) || !is_dir($oDir->path) )
	 return setError(sprintf(_('Internal error, directory %s not exists.'),$strCurrDir)); 
	
	$strNewDir = isset($_POST['NEW_DIR'])?stripslashes($_POST['NEW_DIR']):'';

	
	if(!$oDir->createDir($strNewDir))
		return false;
	
	return true;
}

function createfile(){
	if( !isset($_POST['PAGE_MODEL']) )
		return setError('Internal error, PAGE_MODEL is not set');
	$strPageModel = $_POST['PAGE_MODEL'];

	if( !isset($_POST['CURRENT_DIR']) )
		return setError('Internal error, CURRENT_DIR is not set');
	$strCurrDir = urljsdecode($_POST['CURRENT_DIR']);
	
	if( !($oDir = &getFileObject(SITE_PATH.$strCurrDir)) || !is_dir($oDir->path) )
	 return setError(sprintf(_('Internal error, directory %s not exists.'),$strCurrDir)); 
	 
	$strNewFile = isset($_POST['NEW_FILE'])?stripslashes($_POST['NEW_FILE']):'';
	if( !($oPage = $oDir->createFile($strNewFile)) )
		return false;

	if($strPageModel != 'empty' || strlen($strPageModel)==0 ) {
		$oPageModel = &getFileObject(PAGES_MODELS_PATH.SLASH.$strPageModel);
		if(!is_file($oPageModel->path))
			return setError('Internal error, model '.$strPageModel.' not found');
		
		if(!$oPage->Save($oPageModel->getEditorFileContent()))
			return false;
		
		$tabParamsModel = $oPageModel->oPConfigFile->getTabParams();
		$tabParamsPage = $oPage->oPConfigFile->getTabParams();
		$tabP = array_merge($tabParamsPage,$tabParamsModel);
		$tabP['VIRTUAL_NAME']=$tabParamsPage['VIRTUAL_NAME'];
		$tabP['MENU_ORDER']=$tabParamsPage['MENU_ORDER'];
		$oPage->oPConfigFile->tabParams=$tabP;
		if(!$oPage->oPConfigFile->Save())
			return false;
	}
		
	return true;
}

function createlink(){
	if( !isset($_POST['CURRENT_PAGE']) ){
		return setError('Internal error, CURRENT_PAGE is not set');
	}
	$strCurrPagePath = SITE_PATH.urljsdecode($_POST['CURRENT_PAGE']);
	if( !($oPage=getFileObjectAndFind($strCurrPagePath))){
		return setError(sprintf('Internal error, File not found: %s.',urldecode($_POST['CURRENT_PAGE'])));
	}
	if(!$oPage->createlink())
		return false;
	
	return true;	
}

function deletefile(){
	if( !isset($_POST['FILE_RELATIVE_PATH']) )
		return setError('Internal error in delete, FILE_RELATIVE_PATH is not set');
	
	$strFile = urldecode($_POST['FILE_RELATIVE_PATH']);
	if( !($oFile = &getFileObject(SITE_PATH.$strFile)) )
		return setError(sprintf(_('Internal error, file object %s not exists.'),$strFile)); 
	
	if( !$oFile->delete() )
		return false;

	 return true;
}

function copyfile(){
	if( !isset($_POST['FILE_RELATIVE_PATH']) )
		return setError('Internal error in delete, FILE_RELATIVE_PATH is not set');
	
	$strFile = urljsdecode($_POST['FILE_RELATIVE_PATH']);
	if( !($oFile = &getFileObject(SITE_PATH.$strFile)) )
		return setError(sprintf(_('Internal error, file object %s not exists.'),$strFile)); 
	
	if( !$oFile->Copy(stripslashes(urldecode($_POST['COPY_NAME']))) )
		return false;

	 return true;
}

function renamefile(){
	if(!isset($_POST['filename']) || !isset($_POST['value']))
		return setError('Internal error in rename file');

	$strFilePath = urldecode($_POST['filename']);
	$strNewName = stripslashes($_POST['value']);
	
	if( !($pFile = &getFileObjectAndFind(SITE_PATH.$strFilePath)) ){
		return setError(sprintf(_('Internal error, file object %s not exists.'),$strFilePath)); 
	}
	
	if(!$pFile->Rename($strNewName))
		return false;

	return true;
}

function setpageconfigvar(){
	if( !isset($_POST['FILE_RELATIVE_PATH']) )
		return setError('Internal error in Set Page Config Var, FILE_RELATIVE_PATH is not set');
	if( !isset($_POST['VAR_NAME']) )
		return setError('Internal error in Set Page Config Var, VAR_NAME is not set');
	if( !isset($_POST['VAR_VALUE']) )
		return setError('Internal error in Set Page Config Var, VAR_VALUE is not set');
	
	$strVarName = urldecode($_POST['VAR_NAME']);
	$strVarValue = urldecode($_POST['VAR_VALUE']);
	$strFilePath = urljsdecode($_POST['FILE_RELATIVE_PATH']);
	
	if ( !($oPage = getFileObjectAndFind(SITE_PATH.$strFilePath)) )
		return setError('Can not find the page '.$oPage->getMenuName());
	
	if(!$oPage->oPConfigFile->setParam($strVarName, $strVarValue))
		return false;	
		
	if(!$oPage->oPConfigFile->Save())
		return false;

		
	return true;
}

function movefile(){
	if( !isset($_POST['FILE_RELATIVE_PATH']) )
		return setError('Internal error in movefile, FILE_RELATIVE_PATH is not set');
	if( !isset($_POST['TARGET_DIR']) )
		return setError('Internal error in movefile, TARGET_DIR is not set');

	if( !$oFileToMove = &getFileObjectAndFind(SITE_PATH.urljsdecode($_POST['FILE_RELATIVE_PATH'])) )
		return setError('Internal error in movefile, can not find file to move');
	if( !$oDirTarget  = &getFileObjectAndFind(SITE_PATH.urljsdecode($_POST['TARGET_DIR'])) )
		return setError('Internal error in movefile, can not find file target dir');
	
	if( !$oFileToMove->Move($oDirTarget->path) )
		return false;
	
	return true;
}

function resizeimage(){
	require(SITE_PATH.'core/lib/pimage.php');
	if( !isset($_POST['FILE_RELATIVE_PATH']) )
		return setError('Internal error in resize image, FILE_RELATIVE_PATH is not set');
	if( !isset($_POST['NEW_SIZE']) )
		return setError('Internal error in resize image, NEW_SIZE is not set');
	
	$iNewSize = intval($_POST['NEW_SIZE']);
	if($iNewSize < 100 || $iNewSize > 2048){
		return setError(_('Size value is not valid.'));
	}
	$oImage = new PImage(SITE_PATH.urljsdecode($_POST['FILE_RELATIVE_PATH']));
	if( !is_file($oImage->path) )
		return setError('Internal error in resize image, object image not found.');

	if( !$oImage->is_image() )
		return setError('The file is not an image');

	if( !$oImage->ResizeMax($iNewSize) )
		return false;
	
	return true;
}

/**
 * wrapper, because sort do not pas by doajaxaction, todo
 *
 * @return unknown
 */
function soortpages(){
	if(!sortfiles())
		printError();
	return true;
}

/**
 * Function sortpages
 * This fonction is call by the sortfile javascript plugins.
 * It renames the files. The file begin with a number are ordered.
 * 
 * If an object file not begin with a number, it is not ordered. 
 * 
 * @return: true if suceed, else return false.
 */
function sortpages(){
	if(!isset($_REQUEST['filename']))
		return setError('Internal error in sortfiles, filename not defined');

	$tabFilesNew = $_REQUEST['filename'];

	//if less than two files no need to sort
	if(sizeof($tabFilesNew) < 2) return true;
	
	//get the dir to order, take the second element because in some cas the first element is ../
	$pTemp = new PFile(SITE_PATH.urljsdecode($tabFilesNew[1]));
	$oDirToOrder = new PDir($pTemp->getParentPath());

	$i=0;
	foreach($tabFilesNew as $strFile){
		$strFile = urljsdecode($strFile);
		//if not parent file
		if(SITE_PATH.$strFile != $oDirToOrder->getParentPath()){
			//get the file number, if number exist reorder it
			//this is the original file number, if modified twice it change in php but not in html
			$oFileTest = new PFile($oDirToOrder->path.SLASH.basename($strFile));		
			if( $oFileTest->is_page() || $oFileTest->is_dircategory() || $oFileTest->is_link() ){
				$oFile =  getFileObject($oFileTest->path);	
				$iCurrOrder = $oFile->getMenuOrder();
				$i++;
				if( $iCurrOrder !=  $i){
					//print('reorder '.$oFile->getName().' from '.$iCurrOrder.' to '.$i);
					if(!$oFile->setMenuOrder($i)){
						return false;
					}
				}//if file order has changed
			}//end if filenumber is set
		}//end if ofile not parent dir
	}//end foreach
	return true;
}
function getpagemodelslist(){
	$oDirModels = new PDirCategory(PAGES_MODELS_PATH);
	if(!is_dir($oDirModels->path))	
		return true;
	$tabModels = $oDirModels->listDir($oDirModels->ONLY_FILES,$fullpath=true,'.htm(l)?');
	$strList='';
	foreach($tabModels as $aModelPath){
		$oPageModel = &getFileObject($aModelPath);
		$strId = str_replace(SLASH,'/',$oPageModel->getRelativePath());
		$strList.= $oPageModel->Display(70,$url='#'.$oPageModel->getName());
	}
	echo $strList;
	return true;
}

function ajaxgettext(){
	if(isset($_POST['text']))
		echo _($_POST['text']);
	return true;
}

function loadhistorypage() {
	if(!isset($_REQUEST['strPage']))
		return setError('Internal error in loadhistorypage');

	// recup content html
	$oPpage = new PPage($_REQUEST['strPage']);
	$fckContent = $oPpage->getEditorFileContent();
	echo $fckContent;
	return true;
}

function clearcache(){
	$strType=(isset($_POST['type'])?$_POST['type']:'');
	if(!pcms_clearcache($strType))
		return false;
	echo _('cache is now empty');
	return true;
}


?>
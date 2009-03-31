//<?php
var myWinSelect = null;
var myMoveFile ='' ;

$(function(){
	initFileBrowser();
});

//all the functions needed by the file browser
function initFileBrowser(){

	initContextMenu();
	initSortable();
	initError();
	initFancyZoom();
	initRenameCursor();

}

function initFancyZoom(){
	if(!$.fn.fancyzoom)
		return;
	$.fn.fancyzoom.defaultsOptions.imgDir=SITE_URL+'vendors/jscripts/jqueryplugins/fancyzoom_images/';
	$('a','#browser').fancyzoom();
}

//This is the rename fonction
function initRenameCursor(){
	elBrowser=$("#browser");
	if(elBrowser.size()>0 /*&& elBrowser.is('.sortable')*/){//only apply sortable in file management not in file browser
		
		elBrowser.find("dl[id^='filename']").find('dd').each(function(){
			var strOriginalName = $(this).html();
			var self=$(this);
			self.editable(function(value,settings){
				ajaxAction('renamefile',$.extend({'value':value},settings.submitdata));
			},{
				indicator: _('Loading ...'),
				cssclass:'inputrename',
    			submitdata:{filename:$(this).parent().attr('id').replace(/^filename=/,'')},
    			select:false,
    			data:function(self){return $(self).text();},
    			onblur:'cancel',
    			height:'none',
    			width:80
			});
		});
	}
}


function initSortable(){
	var el = $("#browser");
	//only apply sortable in file management not in file browser
	if(el.length > 0 && el.is('.sortable')){
		el.sortable({
			items:'dl',
			containment: el,
			revert: true,
			placeholder: 'ui-state-highlight',
			start:function(event, ui){
				bBeingSort=true;
			},
			stop:function(event,ui){
				bBeingSort=false;
			},
			update: function(e,ui){
				var strSort = $(this).sortable('serialize',{attribute:'id',expression:'(.+)[=](.+)'});
				msgStatus('Loading ....');
				$.ajax({
					url:'admin_ajax.php?action=sortpages&'+strSort,
					type:'GET',
					error:function(HTTPRequest, textStatus, errorThrown){msgBoxError($(HTTPRequest.responseText).html());},
					complete:function(){msgStatus();}
				});
			}
		});
	}
}


function initContextMenu(){
	var strIdentifier="context_menu_"
	$("dl.folder, dl.file").each(function(){
		var objImg = $(this).find("img[id^='"+strIdentifier+"']");
		if(objImg.size()==1){
			strMenuId = "menu_"+objImg.attr("id").substring(strIdentifier.length);
			objImg.contextMenu(strMenuId,{});
		}
	});
	$("#menu_browser").length>0 && $("#browser").contextMenu('menu_browser',{});
	$("div[id^='jqContextMenu']").hide();
}



function checkName($strName){
	if($strName == '')
		return _('Name can not be empty.');
	return true;
}



function createFile(strCurrDir){
	inputDlg(_('Create a page'),_('Page name:'),function(value,dlg){
		if( (msg= checkName(value))!==true) {msgBoxError(msg);}
		else {
			ajaxAction('createfile',{'CURRENT_DIR':strCurrDir,'NEW_FILE':value},dlg);
		}
	});
}

function createDir(strCurrDir){
	inputDlg(_('Create a directory'),_('Directory name:'),function(value,dlg){
		if( (msg= checkName(value))!==true) {msgBoxError(msg);}
		else {
			ajaxAction('createdir',{'CURRENT_DIR':strCurrDir,'NEW_DIR':value},dlg);
		}
	});
}

function createLink(strCurrPage){
	ajaxAction('createlink',{'CURRENT_PAGE':encodeURIComponent(strCurrPage)});
}



function fileRenameAjax(idBlockFile){
	$("dl[id='"+idBlockFile+"']").find('dd').trigger('click');
}

function copy(strFileRelativePath,strFileName) {
	inputDlg(_('Copy'),_('Copy name :'),function(value, dlg){
			if( (msg= checkName(value))!==true) {msgBoxError(msg);}
			else {ajaxAction('copyfile',{'FILE_RELATIVE_PATH':encodeURIComponent(strFileRelativePath),'COPY_NAME':encodeURIComponent(value)},dlg);}				
			
		},
		null,_('copy')+' '+strFileName);
}

function move(strCurrFile, current_dir, rootpath) {
	myMoveFile = encodeURIComponent(strCurrFile);	
	myWinSelect=PopupCentrer("admin_file_selector.php?current_dir="+encodeURIComponent(current_dir)+"&rootpath="+encodeURIComponent(rootpath),800,600,'resizable=no, location=no, menubar=no, status=no, scrollbars=yes, menubar=no');
}
//use by move, this is the name of the function call by the file selector
function SetUrl(dest){
		ajaxAction('movefile',{'FILE_RELATIVE_PATH':myMoveFile,'TARGET_DIR':encodeURIComponent(dest)});
}

function resizeimage(strFilePath){
	inputDlg(_('Image Resize'),_('New Size (in px):'),function(value, dlg){
			if( (msg= checkName(value))!==true) {msgBoxError(msg);}
			else {ajaxAction('resizeimage',{'FILE_RELATIVE_PATH':encodeURIComponent(strFilePath),'NEW_SIZE':value},dlg);}		
		}
		,null,"800");
}

function deleteFile(strFileRelativePath, strFileName, type){
	confirmDlg(_('Do you really want to delete ')+type+' '+strFileName+' ?',function() { 
		ajaxAction('deletefile',{'FILE_RELATIVE_PATH':encodeURIComponent(strFileRelativePath)},$(this));
	});
}

function setPageConfigVar(strFileRelativePath, strVarName, value){
	ajaxAction('setpageconfigvar',{'FILE_RELATIVE_PATH':encodeURIComponent(strFileRelativePath),'VAR_NAME':strVarName,'VAR_VALUE':value});
}

//?>
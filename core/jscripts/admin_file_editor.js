$(function(){
	initFileEditor();
});
function initFileEditor(){
	initTabs();
	initHistory();
	initEditorHeight();
}

function initEditorHeight(){
	var oFckFrame = $('iframe','.fckEditor');
	if(oFckFrame.length < 1) return;
	var iEditorHeight = (window.top.document.documentElement)?window.top.document.documentElement.clientHeight:$(window.top.document).outerHeight();
	iEditorHeight -= 248;
	if($.browser.safari) iEditorHeight += 10;
	if($.browser.msie) iEditorHeight -= 10;
	oFckFrame.attr('height',(iEditorHeight>400)?iEditorHeight:400);
}

function initTabs() {
	$("#tabPageEditor").tabs({
		show:function(ui){
			window.top.oDialogAdmin && !window.top.oDialogAdmin.dialog('isFullScreen') && window.top.oDialogAdmin.dialog('resizeAuto',false);
		}
	});
}

function initHistory(){
	/* tiroir historique */
	var oHistBlock = $(".panelHistory");
	if(oHistBlock.size()>0){
		var oFckEditor = $(".fckEditor");
		var openTab = $('<div class="openTabs"></div>');
		oHistBlock.before(openTab);
		oHistBlock.css('display','none');
		var resizeEditorFrame = function (){
			oFckEditor.find('iframe:first').width(oFckEditor.width()-15);
		}
		$(".openTabs").toggle(function(){
			oHistBlock.css('display','block');
			oFckEditor.animate({width: oFckEditor.width()-201}, 'fast');
			$(this).css({"backgroundImage": "url(theme/images/admin/sidebar2.gif)"});
	
		},function(){			
			oFckEditor.animate({width: '100%'}, 'fast', function(){oHistBlock.css('display','none');} );
			$(this).css({"backgroundImage": "url(theme/images/admin/sidebar.gif)"});		
		});
	
	}
	
}


/**
 * Callback call when the user click on the cancel button in the editor view
 */
function MyCancel(){
	//if user has clicked on the ctrl+e close the window
	if(tabMyBack.length<2){
		if(window.top != window){
			window.top.oDialogAdmin.dialog('close');
		}
	}else {
		myGoBack();	
	}
}


/**
 * This function is called each time an input text is modified in the config file editor view
 * It reset the hidden textarea before be saved
 */
function reloadFileConfigTextArea(formId){
	var strValue="";
	var oForm = $("#"+formId);
	$("[id^=field_]", oForm).each(function(iIndex){
		var self = $(this);
		if((strVal=self.attr("value"))==undefined)
			strVal="";
		strValue+=self.attr("name")+'="'+strVal+'"';
		strValue+="\n";
	});
	$("textarea#srcParams", oForm).attr("value",strValue);
}

function toggleShowConfigEditor(myForm){
	oTextArea = $('textarea#srcParams',myForm);
	oListParams = $('#listParams',myForm);
	
	if(!oTextArea.is(':visible')){
		reloadFileConfigTextArea($(myForm).attr('id'));
		oTextArea.css('height', oListParams.outerHeight()).slideDown('fast');
		oListParams.slideUp('fast');
	}
	else{
		oListParams.slideDown('fast');
		oTextArea.slideUp('fast');
	}
}
function actionClickOnSaveConfig(formId, strFile, strSection){
	
	var oForm=$("#"+formId);
	if(!$('textarea#srcParams', oForm).is(':visible'))
		reloadFileConfigTextArea(formId);
	
	var strTextValue = $('textarea#srcParams', oForm).attr("value");
	ajaxAction('saveconfigfile',{file:strFile,text:strTextValue,section:strSection},null,function(data){
		notify(data);
	});
	return false;
}

function actionClickOnSaveHtml(o, strUrl, strFile){
	reloadFileConfigTextArea("form_editor_config");
	//the config
	var strTextValueConfig = $('textarea',"#form_editor_config").attr("value");
	
	//get html text
	var bView= $('#'+o.id).find("input[name='view']").attr("value");
	var strTextValue=FCKeditorAPI.GetInstance('text').GetHTML();
	ajaxAction('savepage',{file:strFile,text:strTextValue,textConfig:strTextValueConfig},null,function(data){
		notify(data);
		if(bView == "true")
			setTimeout(function(){window.top.location=strUrl},1000);
	});
	return false;
}

function loadHistoryPage(strPage, myLink) {
	var oLink = $(myLink);
	var oFCK = FCKeditorAPI.GetInstance('text');

	ajaxAction('loadhistorypage', {'strPage':strPage}, null, function(data){
			var strResultCode =  data.replace(/:.*$/,'').replace(/\n/g,'');
			var strResult =  data.replace(/^.*:/,'');
			if( strResultCode == "error" ){
				msgBoxError(strResult);
				return ;
			}
			oFCK.SetHTML(data);
			oLink.parents('ul').find('a').removeClass('selected');
			oLink.addClass('selected');
	});	
}
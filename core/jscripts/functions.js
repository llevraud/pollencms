var timerInfoBulles=false;
$(function() {
	iniInfoBulles();
});




function doAjaxAction(strUrl,strActionName, params, callback,strType){
	if(!strType) strType='POST';
	oData = $.extend({},{'action':strActionName},params);
	msgStatus(_('Loading ...'));
	$.ajax({
		url:strUrl,
		type:strType,
		data:oData,
		success:function(data, textStatus){
			callback && callback.call(this,data);
		},
		error:function(HTTPRequest, textStatus, errorThrown){msgStatus();msgBoxError($(HTTPRequest.responseText).html());},
		complete:function(){msgStatus();}
	});
}

function ajaxAction(strActionName, params, dlgToClose, callback){
	doAjaxAction(SITE_URL+'core/admin/admin_ajax.php',strActionName, params, function(data){
			dlgToClose && dlgToClose.dialog('destroy');
			!callback && myRelodPage();
			callback && callback.call(this,data);			
	});
}

function iniInfoBulles(){
	if( $("a.infobulles").length == 0 )
		return;
	//create div tool tip if not extists
	var oToolTip=$("#tooltip");
	if( oToolTip.length == 0 ){
		oToolTip = $('<div id="tooltip"></div>');
		$(document.body).append(oToolTip);
		oToolTip.css({top:0,left:0,position:"absolute"});
	}

	stopInfoBulles(oToolTip);

	$("a.infobulles:last").css("margin-right",0);
	$("a.infobulles").hover(function(){
		//on panel hover
		if(!oToolTip.is(":visible") && timerInfoBulles){
			clearTimeout(timerInfoBulles);timerInfoBulles=false;
		}
		if(!oToolTip.is(":visible") && !timerInfoBulles){
			var self = $(this);
			pOffset=$("img",self).offset();
			iWD=(oToolTip.width()-self.width())/2+5;
			iTargetTop=pOffset["top"]-oToolTip.height()-10;//-10;
			oToolTip.css({top:(iTargetTop+10),left:(pOffset["left"]-iWD)}).html($("span",self).html());
			if(oToolTip.is(":animated")==false && !timerInfoBulles)
				timerInfoBulles=setTimeout(function(){timerInfoBulles=false;oToolTip.show().css({opacity:0}).animate({top:iTargetTop,opacity:1},1000)},500);
		}//end tool tip not visible
	},function(){
		//on panel out
		oToolTip.is(":visible") && stopInfoBulles(oToolTip);
	});
}

function stopInfoBulles(oToolTip){
	if(!oToolTip){var oToolTip = $("#tooltip");}
	oToolTip.html("").hide();
	if(timerInfoBulles) {clearTimeout(timerInfoBulles);timerInfoBulles=false;};
}

myPop = null;
function PopupCentrer(page,largeur,hauteur,options) {
	var top=(screen.height-hauteur)/2;
	var left=(screen.width-largeur)/2;
	if(!options)
		options = "resizable=no, location=no, menubar=no, status=no, scrollbars=yes, menubar=no";
	myPop = window.open(page,"Gestion","top="+top+",left="+left+",width="+largeur+",height="+hauteur+","+options);
}

function notify(strMessage,iTime){
	if(!iTime) iTime=1000;
	if(!$.jGrowl){
		var tabLoad = new Array(SITE_URL+'vendors/jscripts/jqueryplugins/jgrowl/jquery.jgrowl-1.1.2_compressed.js');
		loadJS(tabLoad,function(){
			$.jGrowl(strMessage,{life:iTime});
		});
	}else{
		$.jGrowl(strMessage,{life:iTime});
	}
}


function confirmDlg(strMessage,fctYes,fctNo){
	var dlg = $('<div style="text-align:center">'+strMessage+'</div>').dialog({
		title: _('Confirm message'),
		modal:true,
		resizable:true,modal:true, position:'center',
		buttons: {
			'Yes': fctYes ,
			'No': function() {$(this).dialog('destroy'); fctNo && fctNo.call(this);$(this).remove();}
		}
	});
	var btnNo = dlg.parent('.ui-dialog:first').find('button:last');
	btnNo.text(_('No'));
	var btnYes = dlg.parents('.ui-dialog:first').find('button:first');
	btnYes.text(_('Yes')).focus();
	return false;
	
}

function inputDlg(strTitle,strLabel,fctOk,fctCancel,value){
	//options.buttons = $.extend(options.buttons,{'Cancel': function() { $(this).dialog('destroy');}});
	//options = $.extend({label:'valeur :',inputsize:'', value:'',position:'top', resizable:false,modal:true, height: 140}, options);
	if(!value) value="";
	var obj=$('<div><div style="padding:0px 10px">'+strLabel+' <input type="text" value="'+value+'" id="inputValue" size="'+20+'"/></div></div>')
		.dialog({
			title:strTitle,
			label: strLabel,
			position:'center',
			modal:true,
			buttons: {
				'Ok': function() {
					fctOk && fctOk.call(this,$('input',this).val(),$(this));
					//$(this).dialog('destroy');
				},
				'Cancel':function(){
					fctCancel && fctCancel.call(this);
					$(this).dialog('destroy').remove();
				}
			}
		});
	var objDlg = obj.parents('.ui-dialog:first');
	var btnOk = $('button:first',objDlg).text(_('Ok'));
	var btnCancel = $('button:last',objDlg).text(_('Cancel'));
	$('input',objDlg).focus().keypress(function (e) {
			//if user click on enter
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
			(key == 13) &&  btnOk.trigger('click');
		});
	return false;
}

function msgStatus(strMessage){
	var oMsgStatus = $('#msgStatus');
	//hide message status
	if(!strMessage){
		if(oMsgStatus.length > 0){
			oMsgStatus.css('visibility','hidden');
		}
		return;
	}
	if(oMsgStatus.length > 0){
		$('span',oMsgStatus).html(strMessage);
	}else{
		oMsgStatus = $('<div id="msgStatus">&nbsp;&nbsp;&nbsp;&nbsp;<span>'+strMessage+'</span>&nbsp;&nbsp;&nbsp;&nbsp;</div>');
		oMsgStatus.prependTo('body');
	}
	//calculate position
	var iWidth = oMsgStatus.width();
	var iPageWidth = $(document).width();
	var iLeft = (iPageWidth - iWidth)/2;
	oMsgStatus.css({'left':iLeft,'visibility':'visible'});	
}

function msgBoxError(strMessage,iTop){
	if(!iTop) iTop = 'center';
	var winError = $('<div class="msgboxError" ><div class="content ui-state-error"><span class="ui-icon ui-icon-alert" style="margin: 0pt 7px 50px 0pt; float: left;"/>'+strMessage.replace(/\n/,"<br />")+'</div></div>')
		.prepend('<div class="icon"></div>')
		.dialog({
			title: _('Erreur'),
			buttons: {'OK': function() {$(this).dialog('destroy');}},
			position:['center',iTop], resizable:false,modal:true, height: 140
		});
		$('.icon',winError).ifixpng();
		winError.parents('.ui-dialog').find('button').focus();
		return winError;	
}

function initError(){
	if($('.error').length > 0){
		var objError = $('.error').remove();
		msgBoxError(objError.html());
	}
}

//Stock the translations in an array, if not exists, ajax request to get the translation in php
var tabTranslation = Array();
tabTranslation[USER_LANGUAGE]= Array();
function _(strText){
	if(tabTranslation[USER_LANGUAGE][strText])
		return tabTranslation[USER_LANGUAGE][strText];
	strTranslated ='not yet';
	$.ajax({
		async:false,
		type: "POST",
		url:SITE_URL+'core/admin/admin_ajax.php',
		data:{'action':'ajaxgettext','text':strText},
		success: function(msg){
	     strTranslated=msg;
	    }
	});
	tabTranslation[USER_LANGUAGE][strText]=strTranslated;
	return strTranslated;
}

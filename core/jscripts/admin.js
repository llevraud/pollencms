var oDialogAdmin=null;
var iDialogWidth=800;
var strFileEditorUrl=false;

//script à charger lors du ctrl+a
var	$tabScriptsToLoadDialog = new Array(
		SITE_URL+'vendors/jscripts/jqueryui/jquery-ui-1.7.1.js',
		SITE_URL+'core/jscripts/ui.dialog.extra.js',
		SITE_URL+'vendors/jscripts/jqueryplugins/jquery.metadata.js'
	);

//chargement de la page, on ne charge que les hotkeys
$(function(){
	initHotkeys();
});

function loadJS(tab, callback){
	loadScript(0, tab, callback);
}
function loadScript(iIndex, tab, callBack){
	//fin du chargement, on lance la fonction
	if(iIndex == tab.length) {
		//because safari sometimes bugs add a timeout before exec the action
		if($.browser.safari)
			setTimeout(callBack.apply(),200);
		else
			callBack.apply(); 
		return;
	}
	var iNext = iIndex+1;
	$.ajax({
		type: "GET",
		url: tab[iIndex],
		data: null,
		success: function(){loadScript(iNext, tab, callBack);},
		dataType: 'script',
		cache:true
	});
}

function initHotkeys (){
	//ADMIN HOT KEYS ACTIONS
	var htkeyadmin = (HOTKEY_OPENADMIN)?HOTKEY_OPENADMIN:"Ctrl+a";
	$.hotkeys.add(htkeyadmin, function(){
		if(oDialogAdmin == null){
			loadJS($tabScriptsToLoadDialog, initDialog);return;
		}
		if( oDialogAdmin.dialog('isOpen') ){
			oDialogAdmin.dialog('close');
		}
		else {
			oDialogAdmin.dialog('openAdmin');
		}
	});
	$.hotkeys.add('Ctrl+j', function(){
		if(oDialogAdmin != null){oDialogAdmin.dialog('fullscreen');}
	});
	$.hotkeys.add('Ctrl+e', function(){
		if(current_page_path) {
			var urlEditorRelative= 'admin_file_editor.php?file='+escape(current_page_path);
			var ulrEditorAbsolute = SITE_URL+'core/admin/'+urlEditorRelative;
			if(oDialogAdmin==null){loadJS($tabScriptsToLoadDialog, function(){initDialog(ulrEditorAbsolute);});return;}
			else {
				var oIFrame = $('iframe',oDialogAdmin);
				//si la page courante est la page d'Ã©dition on rÃ©ouvre sans changer d'url
				if(oDialogAdmin){
					var currentUrl = oDialogAdmin.data('current_url');
					if( unescape(currentUrl).indexOf(urlEditorRelative)>-1 || (!currentUrl && oIFrame.attr('src') == ulrEditorAbsolute) ){
						!oDialogAdmin.parents('.ui-dialog').is(':visible') && oDialogAdmin.dialog('openAdmin');
						return;
					}					
				}
				oIFrame.attr('src', ulrEditorAbsolute);
				!oDialogAdmin.parents('.ui-dialog').is(':visible') && oDialogAdmin.dialog('openAdmin');
			}
		}
		else{
			alert("Cette page n'est pas Ã©ditable.");
		}
	});
}

function initDialog(strFileEditorUrl){
	if(!strFileEditorUrl)
		strFileEditorUrl=SITE_URL+'core/admin/admin.php';
	//Iframe that contains the admin page
	var oIFrame = $('<iframe frameborder="0" hspace="0" class="frameContent" style="width:100%"></iframe>')
		.attr({'src':strFileEditorUrl, 'frameborder':'0', 'hspace':'0'});

	//The adming window object
	//attention option autoResize casse tout
	oDialogAdmin=$('<div>')
	.addClass('pcms')
	.css({'overflow':'hidden','background':'#F5F5F5'})
	.append(oIFrame)
	.dialog({title:"Chargement en cours ....",width:iDialogWidth,minHeight:40, position:Array('center',20),autoResize:false,resizable:false,modal:true,dragable:true,autoOpen:false,bgiframe:false,
		dragStop:function(event,ui){
		}	
	})
	.bind('dialogclose',function(){
	
		$('embed, object').css('visibility','visible');	
		window.focus();	
	})
	.bind('dialogopen',function(){
		//due to a ui dialog bug that do an appendTo to each open, we must use an other function
	});
	
	$('embed, object').css('visibility','hidden');			

	oDialogAdmin.dialog('open');
}

function max(i,j){
	return (i<j)?j:i;
}

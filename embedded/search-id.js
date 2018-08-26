// https://search-id.org
//
// This file is part of search-id.org project.
//
// search-id is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// search-id is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this file. If not, see <http://www.gnu.org/licenses/>.

var Id2Web =
{
	version: '0.4α',
	defaultParams: 
	{
		id: '',
		autoplay: true,
		layout: 'auto',
		direct: false,
		file: '',
		ws: '' 
	},
	extensions:
	{
		markdown: ['md','md.txt'],
		bbcode: ['bbc','bbcode','bbc.txt','bbcode.txt'],
		image: ['png','jpg','jpeg','gif','svg'],
		pre: ['ascii','txt','js','css','vtt','srt'],
		video: ['mp4','webm','ogv','mkv'],
		subtitles: ['vtt','srt'],
		audio: ['ogg','mp3','wav'],
		iframe: ['pdf'],
		html: ['html','htm'],
		primary: ['htm','html','mp4','webm','ogv','pdf'],
		order: ['png','jpg','jpeg','gif','svg','mp4','webm','ogv','mkv','ogg','mp3','wav','vtt']
	},

	instanceId: parseInt(Math.random()*10000),
	lang: {},
	client: null,
	params: null,
	graph: null,
	speedDownLast: 0,
	speedDownTime: 0,
	speedUpLast: 0,
	speedUpTime: 0,
	playTime: 0,
	poolTime: 0,
	fetchMethods: {},

	pendingDomTrack: [],

	start: function () {

		console.log('search-id (' + Id2Web.instanceId + '): Version ' + Id2Web.version)
		this.params = this.getParamsFromUrl(Id2Web.defaultParams)
		console.log('search-id (' + Id2Web.instanceId + '): Options', this.params)

		Id2Web.client = new WebTorrent()	

		if (this.params['id'] == '')
			this.params['id'] = this.home

		this.params['id'] = this.params['id']

		$("#main-open").fadeIn()
		$("#main-area").hide()
		
		$("#nav .home").attr("data-tooltip",Id2Web.getLang("tooltip.home"))
		$("#nav .home").click(function(){
			Id2Web.params["id"] = Id2Web.home
			Id2Web.updateUI()
			Id2Web.play()
		})

		$("#nav .add").attr("data-tooltip",Id2Web.getLang("tooltip.add"))
		$("#nav .add").click(function(){
			$("#files-upload").click()
		})

		$("#nav .search").attr("data-tooltip",Id2Web.getLang("tooltip.search"))
		$("#nav .search").click(function(){
			var id = $("#nav input").val()
			Id2Web.params["id"] = id
			Id2Web.updateUI()
			Id2Web.play()
		})

		$("#nav input").keypress(function(event) {
			if (event.which == 13) {
				event.preventDefault()
				$("#nav .search").trigger("click")
			}
		})

		$("#nav input").attr("placeholder", Id2Web.home)

		$("#download").attr("data-tooltip",Id2Web.getLang("tooltip.download"))
		$("#upload").attr("data-tooltip",Id2Web.getLang("tooltip.upload"))
		$("#peers").attr("data-tooltip",Id2Web.getLang("tooltip.peers"))

		$("#peers").click(function (e) {
			var torrent = Id2Web.torrentGetCurrent()
			
			if( (torrent != null) && ($("#peers-graph").length == 0) )
			{
				Id2Web.peersGraphShow()
			}
			else
			{
				Id2Web.peersGraphHide()				
			}
		})	

		$("#layout-auto").attr("data-tooltip",Id2Web.getLang("tooltip.layout.auto"))
		$("#layout-auto").click(function (e) {
			if($(this).hasClass('disabled'))
				return
			Id2Web.params["layout"] = "auto" 
			Id2Web.updateUI()
			Id2Web.changeView()
		})
		$("#layout-list").attr("data-tooltip",Id2Web.getLang("tooltip.layout.list"))
		$("#layout-list").click(function (e) {
			if($(this).hasClass('disabled'))
				return
			Id2Web.params["layout"] = "list" 
			Id2Web.updateUI()
			Id2Web.changeView()
		});
		$("#layout-binary").attr("data-tooltip",Id2Web.getLang("tooltip.layout.binary"));
		$("#layout-binary").click(function (e) {
			if($(this).hasClass('disabled'))
				return;
			Id2Web.params["layout"] = "binary"; 
			Id2Web.updateUI();
			Id2Web.changeView();
		});
		$("#layout-none").attr("data-tooltip",Id2Web.getLang("tooltip.layout.none"));
		$("#layout-none").click(function (e) {
			if($(this).hasClass('disabled'))
				return;
			Id2Web.params["layout"] = "none"; 
			Id2Web.updateUI();
			Id2Web.changeView();
		});

		$("#share-www").attr("data-tooltip",Id2Web.getLang("tooltip.share.www"));
		$("#share-www").addClass('copy-to-clipboard')
		
		$("#share-html").attr("data-tooltip",Id2Web.getLang("tooltip.share.html"));		
		$("#share-html").addClass('copy-to-clipboard')

		$("#share-magnet").attr("data-tooltip",Id2Web.getLang("tooltip.share.magnet"));
		$("#share-magnet").addClass('copy-to-clipboard')

		$("#share-torrent").attr("data-tooltip",Id2Web.getLang("tooltip.share.torrent"));				

		$(".copy-to-clipboard").click(function (e) {
			if($(this).hasClass("disabled"))
				return;
			var copyText = $(this).data("copy-text");
			prompt("Copy to clipboard", copyText);
		});

		$('#files-upload').hide();
		$('#files-upload').change(function (e) {
			e.preventDefault();
			var input = document.getElementById('files-upload');

			if(input.files.length == 0)
				return
			
			for(var f=0;f<input.files.length;f++)
			{
				if(input.files[f].size>Id2Web.fileSizeLimit)
				{
					alert(Id2Web.getLang("file.too-big", input.files[f].name, Id2Web.bytesToStr(Id2Web.fileSizeLimit, true)));
					return;
				}
			}
			Id2Web.play(input.files)
		});

		$("#menu").click(function(){
			$("#main-area").fadeToggle();
			Id2Web.peersGraphHide();
		});

		$("#play").click(function(){
			Id2Web.play();
		});

		$("#version").text(Id2Web.version);		

		// TOFIX: Ignored style in css for body, don't know why
		$("body").css("padding",0);
		$("body").css("margin",0);
		$("body").css("font-family","Helvetica");
		$("body").css("background-color","rgba(242,242,242,1)");

		Id2Web.resetUI()

		setInterval(function () {
			Id2Web.updateUI2();
		}, 1000);
		Id2Web.updateUI();

		if(Id2Web.params["autoplay"])
		{
			Id2Web.play();
		}
		else
		{
			$("#play").fadeIn();
		}
	},

	resetUI: function()
	{
		Id2Web.playTime = 0;
		Id2Web.poolTime = 0

		$("#download").text("Download: -");
		$("#download").css("opacity",0.2);
		$("#download").css("background-size", "1.6em 1.6em, 0% 100%");
		$("#upload").text("Upload: -");
		$("#upload").css("opacity",0.2);
		$("#peers").text(Id2Web.getLang("stats.peers","?"));
		$("#peers").css("opacity",0.2);

		$("#files").empty();

		$("#share-magnet").addClass('disabled')
		$("#share-torrent").addClass('disabled')
		$("#share-torrent").attr("href",'#')

		$("#layout-auto").addClass("disabled")
		$("#layout-list").addClass("disabled");
		$("#layout-binary").addClass("disabled");
		$("#layout-none").addClass("disabled");
	},

	updateUI: function()
	{
		if(Id2Web.params["id"] == Id2Web.home)
			$("#nav input").val("");
		else
			$("#nav input").val(Id2Web.params["id"]);

		var newUrl = Id2Web.buildUrl();
		
		// TOFIX: Probably 'back' button don't work well.
		window.history.pushState(null, null, newUrl);

		$("#share-www").data("copy-text", newUrl);

		var embedHtml = "<iframe src=\"" + Id2Web.buildUrl({autoplay:false}) + "\"></iframe>";
		$("#share-html").data("copy-text", embedHtml);

		this.updateUI2();
	},

	updateUI2: function()
	{
		var torrent = Id2Web.torrentGetCurrent();
		
		if(Id2Web.playTime == 0)
		{
			$("#status").text(Id2Web.getLang("status.waiting"));
			Id2Web.statusColor("white");
		}
		
		if(torrent == null)
		{

		}
		else
		{
			var now = (new Date()).getTime();

			$("#peers").text(Id2Web.getLang("stats.peers",torrent.numPeers));
			$("#peers").css("opacity","");

			if(torrent.uploaded != 0)
			{
				var upSpeed = 0;
				if (Id2Web.speedUpTime != 0)
					upSpeed = (torrent.uploaded - Id2Web.speedUpLast) / (now - Id2Web.speedUpTime) * 1000;
				Id2Web.speedUpTime = now;
				Id2Web.speedUpLast = torrent.uploaded;
				$("#upload").text(Id2Web.getLang("stats.upload", Id2Web.bytesToStr(torrent.uploaded, true), Id2Web.bytesToStr(upSpeed, false) + "/s"));
				$("#upload").css("opacity","");
			}

			if(torrent.downloaded == 0)
			{
				if( (Id2Web.playTime !=0) && (Id2Web.poolTime == 0) )
				{				
					var waitTime = (new Date()).getTime() - Id2Web.playTime					
					if(waitTime > 20000)
					{
						Id2Web.poolNotification()
					}
				}		
			}
			else if(torrent.done == false)
			{
				var downSpeed = 0;
				if (Id2Web.speedDownTime != 0)
					downSpeed = (torrent.downloaded - Id2Web.speedDownLast) / (now - Id2Web.speedDownTime) * 1000;
				Id2Web.speedDownTime = now;
				Id2Web.speedDownLast = torrent.downloaded;
				$("#download").text(Id2Web.getLang("stats.download", Id2Web.bytesToStr(torrent.downloaded, true), Id2Web.bytesToStr(torrent.length, true), Id2Web.bytesToStr(downSpeed, false) + "/s"));
				$("#download").css("opacity","");

				var percProgress = (100 * torrent.progress).toFixed(1) + "%";
				$("#status").text(Id2Web.getLang("status.download", percProgress, Id2Web.millisecondsToStr(torrent.timeRemaining)));
				Id2Web.statusColor("yellow");
				$("#download").css("background-size", "1.6em 1.6em, " + percProgress + " 100%");
			}
			else
			{
				$("#download-progress").css("width", $("#download").width());
				$("#download").text("Downloaded:" + Id2Web.bytesToStr(torrent.downloaded, true));
				$("#download").css("opacity","");
				$("#download").css("background-size", "1.6em 1.6em, 100% 100%");

				$("#status").text(Id2Web.getLang("status.seeding", torrent.numPeers));
				Id2Web.statusColor("green");
			}

			if(torrent.files != null)
			{
				for (var f=0;f<torrent.files.length;f++)
				{
					var file = torrent.files[f];

					// Can be more that one: one in menu-area, one in viewer-binary.
					var domFiles = $(".file[data-name='" + Id2Web.hashString(file.name) + "']");
					domFiles.data('file', file)

					domFiles.each(function( i ) {
						var domFile = $(this)
						var file = domFile.data('file')

						if(file.done)
						{
							if(domFile.hasClass("file-done") == false)
							{
								domFile.removeClass("file-pending");
								domFile.addClass("file-done");

								domFileOpen = domFile.find('.file-open');
								domFileOpen.removeClass('disabled')
								domFileOpen.data("file", file);
								domFileOpen.click(function() {
									Id2Web.fileOpenInNewTab($(this).data("file"));
								});							

								domFileSave = domFile.find('.file-save');
								domFileSave.removeClass('disabled')
								domFileSave.data("file", file);
								domFileSave.click(function() {
									Id2Web.fileDownload($(this).data("file"));
								});							
							}
						}
						else
						{
							if(domFile.hasClass("file-pending") == false)
							{
								domFile.addClass("file-pending");
							}
						}
					})
				}
			}

			// This because <video> can be created after the <track> dom items.
			if(Id2Web.pendingDomTrack.length>0)
			{
				var domVideo = $("#viewer .item>video");
				if(domVideo.length>0)
				{
					domVideo.attr("crossorigin","anonymous"); // Otherwise fail to load VTT
					for(var t=0;t<Id2Web.pendingDomTrack.length;t++)
					{
						domVideo.append(Id2Web.pendingDomTrack[t])
					}
					Id2Web.pendingDomTrack = []
				}
			}
		}
	},

	updateUiMagnetLink: function(magnet)
	{
		$("#share-magnet").removeClass('disabled')
		$("#share-magnet").data("copy-text", magnet);
	},

	updateUiTorrentLink: function(torrent)
	{
		if(torrent.files.length == 0)
			return

		Id2Web.updateUI2()

		$("#share-torrent").removeClass('disabled')
		$("#share-torrent").attr('href',torrent.torrentFileBlobURL)
		$("#share-torrent").attr('download',torrent.name + '.torrent')

		Id2Web.poolNotification()
	},

	poolNotification: function()
	{
		if(Id2Web.pools.length == 0)
			return

		// When don't download any bytes in X secs
		// When download is complete
		
		var torrent = Id2Web.torrentGetCurrent()
		if(torrent == null)
			return

		Id2Web.poolTime = (new Date()).getTime();

		// Notification		
		for(var p=0;p<Id2Web.pools.length;p++)
		{
			var url = Id2Web.pools[p].url
			var data = {
				act: 'request',
				key: Id2Web.pools[p].key,
				hash: torrent.infoHash
			}
			Id2Web.log(Id2Web.getLang("steps.notify.title"), Id2Web.getLang("steps.notify.subtitle", url));
			$.ajax({
				dataType: "json",
				url: url,
				data: data,
				success: function(answer)
				{
					if(answer["result"] == "blacklist")
					{
						Id2Web.log(Id2Web.getLang('pool.blacklisted', url))
					}
					else if( (answer["result"] == "miss-id") || (answer["result"] == "miss-torrent") )
					{
						if( (answer["result"] == "miss-torrent") && (torrent.files.length == 0) )
							return

						if(torrent.files.length != 0)
							Id2Web.log(Id2Web.getLang('pool.uploading.torrent', url))
						else
							Id2Web.log(Id2Web.getLang('pool.uploading.magnet', url))
						
						var fd = new FormData()
						fd.append('act', 'set-torrent')						
						fd.append('key', data.key)						
						fd.append('magnet', torrent.magnetURI) // TOFIX					
						if(torrent.files.length != 0)
						{
							var blob = new Blob([torrent.torrentFile], {type:'application/octet-stream'})
							fd.append('torrent', blob)
						}							
						fd.append('hash', data.hash) // TOFIX
						$.ajax({
							type: 'POST',
							url: url,
							data: fd,
							contentType: false,
							processData: false,
							cache: false,
							success: function(answer)
							{
								if(answer["result"] == 'ok')
									Id2Web.log(Id2Web.getLang('pool.uploaded', url))
							},
							error: function(jqXHR, textStatus, errorThrown) 
							{
            					Id2Web.log( "Request failed: " + textStatus );
        					}
						})
					}
				}
			});
		}
	},

	buildUrl: function(newParams)
	{
		var diffParams = {};
		var nDiffParams = 0;

		var params = $.extend({}, Id2Web.params);
		if(newParams != null)
			params = $.extend(params, newParams); 
		//var params = Id2Web.params;

		for (var paramKey in params) {
			if( (paramKey == "id") && (params["id"] == Id2Web.home) )
				continue;

			if(params[paramKey] != Id2Web.defaultParams[paramKey])
			{
				nDiffParams++;
				diffParams[paramKey] = params[paramKey];
			}				
		}

		var newUrl = window.location.href.split('?')[0];
		if(nDiffParams>0)
		{
			newUrl += "?";
			var iParam=0;
			for (var paramKey in diffParams) {
				if(iParam>0)
					newUrl += "&";					
				if( (paramKey == "id") && (nDiffParams == 1) )
					newUrl += encodeURIComponent(params["id"]);
				else
					newUrl += encodeURIComponent(paramKey) + "=" + encodeURIComponent(diffParams[paramKey]);
				iParam++;
			}	
		}
		return newUrl;
	},

	statusColor: function(color)
	{
		var color2 = color;
		if(color2 == "yellow")
		{
			color2 = "#d2d252";
		}
		else if(color2 == "white")
		{
			color2 = "#888888";
		}
		shadow = color2;		
		$("#main-area").css("border-left","1em solid " + color2);
		$("#main-area").css("box-shadow","0px 0px 1em " + shadow);
		/*
		$("body").css('background-color',color)
		if(color == "white")
			$("body").css('padding-top','0px')
		else
			$("body").css('padding-top','50px')
		*/

		//$("body").css('background-color',color)
		if( (color == "green") || (color == 'white') )
			$("body").css('border-top','0px solid ' + color2)
		else
			$("body").css('border-top','10px solid ' + color2)

		var metaThemeColor = document.querySelector("meta[name=theme-color]");
		metaThemeColor.setAttribute("content", color);
	},

	message: function(title, subtitle)
	{		
		$(".message" ).each(function( index ) {
			if(("dismiss" in $(this).data()) == false)
			{
				$(this).data("dismiss",true);

				$(this).animate({
					opacity: 0,
					top: "-=1em"
				}, 1000, function() {
					$(this).remove();
				});
			}
		});

		if(title != "")
		{
			var logMessage = "UI Message:" + title;
			if(subtitle != "")
				logMessage += ", subtitle:" + subtitle;
			Id2Web.log(logMessage);

			var domMessage = $("<div></div>");
			domMessage.hide();
			domMessage.addClass("message");
			$("body").append(domMessage);
			domMessage.html(title + "<div class='subtitle'>" + subtitle + "</div>");
			domMessage.fadeIn();

			Id2Web.setDocumentTitle(title);
		}
	},

	setDocumentTitle: function(msg)
	{
		document.title = msg + " - search-id";
	},

	play: function(files)
	{
		$("#play").fadeOut();

		$("#viewer").empty();

		Id2Web.client.torrents.forEach(function(torrent) {
			Id2Web.client.remove(torrent.infoHash);		
		});

		Id2Web.resetUI()

		Id2Web.playTime = (new Date()).getTime();

		Id2Web.updateUI2(null);

		if(files == null)
		{
			$("#status").text(Id2Web.getLang("status.searching"));
			Id2Web.statusColor("yellow");
			Id2Web.playData(this.params["id"]);
		}
		else if( (files.length == 1) && (Id2Web.matchExtension(files[0].name, ['torrent'])) )
		{
			$("#status").text(Id2Web.getLang("status.searching"));
			Id2Web.statusColor("yellow");
			Id2Web.playTorrentFile(files[0])				
		}
		else
		{
			$("#status").text(Id2Web.getLang("status.upload"));
			Id2Web.statusColor("yellow");
			Id2Web.playFiles(files)
		}
	},

	playData: function(id)
	{
		Id2Web.log("Looking: " + id + " (" + id.length + " chars length)");

		/*
		if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(id)) {
			this.fetchBitcoinInsightAddressData(id, "BTC blockchain","(via blockexplorer.com)", "https://blockexplorer.com/api");
		}
		else if (/^[a-fA-F0-9]{64}$/.test(id)) {
			this.fetchBitcoinInsightTransactionData(id, "BTC blockchain","(via blockexplorer.com)", "https://blockexplorer.com/api");
		}
		*/

		/*
		// Don't work, don't have OP_RETURN data...
		if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(id)) {
			this.fetchBchBtcDotComAddressData(id, "BCH blockchain (via btc.com)", "https://bch-chain.api.btc.com");
		}
		*/
		if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(id)) {
			this.fetchBitcoinCashInsightAddressData(id, "BCH blockchain","(via bitcoincash.blockexplorer.com)", "https://bitcoincash.blockexplorer.com/api");
		}
		else if (/^[a-z0-9]{64}$/.test(id.toLowerCase())) {
			this.fetchBitcoinCashInsightTransactionData(id, "BCH blockchain","(via bitcoincash.blockexplorer.com)", "https://bitcoincash.blockexplorer.com/api");
		}
		else if (/^[a-fA-F0-9]{40}$/.test(id)) {
			this.playInfoHash(id);
		}
		else if (/(magnet\:\?[^\s]+)\b/.test(id)) {
			var magnet = id.match(/(magnet\:\?[^\s]+)\b/i)[1];
			this.playMagnet(magnet)
		}		
		else {
			Id2Web.message("Unknown address","<pre>" + id + "</pre>");
			$("#status").text(Id2Web.getLang("status.404"));
			Id2Web.statusColor("red");
		}
	},
	
	torrentGetCurrent: function()
	{
		if(Id2Web.client.torrents.length == 0)
			return null;
		else
			return Id2Web.client.torrents[0];
	},

	playInfoHash: function(id)
	{
		var magnet = Id2Web.buildMagnetLink(id);

		Id2Web.playMagnet(magnet)
	},

	playMagnet: function(magnet)
	{		
		Id2Web.updateUiMagnetLink(magnet)

		var magnetClient = Id2Web.adaptMagnet(magnet)
		
		/*
		// Notification		
		for(var p=0;p<Id2Web.pools.length;p++)
		{
			var url = Id2Web.pools[p].url
			var data = {
				act: 'request',
				user: Id2Web.pools[p].user,
				q: magnet
			}
			Id2Web.message(Id2Web.getLang("steps.notify.title"), Id2Web.getLang("steps.notify.subtitle", url));
			$.ajax({
				dataType: "json",
				url: url,
				data: data
			});
		}
		*/

		var id = magnet.match(/btih\:([0-9a-f]+)/i)[1]; 
		
		Id2Web.message(Id2Web.getLang("steps.searching.title"), Id2Web.getLang("steps.searching.subtitle.id", id));
		
		Id2Web.client.add(magnetClient, Id2Web.processTorrent);
	},

	playTorrentFile: function(file)
	{
		var opts={
			announce: Id2Web.trackers.always
		};

		Id2Web.message(Id2Web.getLang("steps.searching.title"), Id2Web.getLang("steps.searching.subtitle"));
		
		Id2Web.client.add(file, opts, function(torrent) {
			Id2Web.params["id"] = torrent.infoHash;
			Id2Web.updateUI();				
			var magnet = Id2Web.buildMagnetLink(torrent.infoHash);
			Id2Web.updateUiMagnetLink(magnet)
			Id2Web.processTorrent(torrent);
		});
	},

	playFiles: function(files)
	{	
		var opts={
			announce: Id2Web.trackers.always
		};

		Id2Web.message(Id2Web.getLang("steps.searching.title"), Id2Web.getLang("steps.searching.subtitle"));
		Id2Web.client.seed(files, opts, function(torrent) {
			Id2Web.params["id"] = torrent.infoHash;
			Id2Web.updateUI();				
			var magnet = Id2Web.buildMagnetLink(torrent.infoHash);
			Id2Web.updateUiMagnetLink(magnet)
			Id2Web.processTorrent(torrent);

			Id2Web.updateUiTorrentLink(torrent);
		});
	},

	buildMagnetLink: function(id)
	{
		var magnet = "magnet:?xt=urn:btih:" + id;
		return Id2Web.adaptMagnet(magnet)
	},

	adaptMagnet: function(magnet)
	{
		var hash = magnet.match(/btih\:([0-9a-f]+)/i)[1]; 
		if(hash == '')
			return '';

		var params = []
		var query = magnet.substring(magnet.indexOf('?')+1);
		var queryParams = query.split('&')  
		for(var p=0;p<queryParams.length;p++)
		{    
			var qParam = queryParams[p]
			if(qParam.indexOf('=') == -1)
				continue
			var param = {}
			var k = qParam.substring(0, qParam.indexOf('='))
			var v = decodeURIComponent(qParam.substring(qParam.indexOf('=')+1))

			if(k == 'xt')
			continue
			if(k == 'dn')
			continue

			if( (k == 'tr') && (Id2Web.trackers.blacklist.includes(v)) )
				continue
			
			param.name = k
			param.value = v
			params.push(param)
		}
		
		// Build
		var m = 'magnet:?xt=urn:btih:' + hash
		for(var t=0;t<Id2Web.trackers.always.length;t++)
			m += '&tr=' + encodeURIComponent(Id2Web.trackers.always[t])
		for(var p=0;p<params.length;p++)
			m += '&' + params[p].name + '=' + encodeURIComponent(params[p].value)
		
		return m
	},

	processTorrent: function(torrent)
	{
		torrent.on('warning', function (warning) {
			Id2Web.log("WebTorrent Warning: " + warning);
		})

		torrent.on('error', function (err) {
			Id2Web.log("WebTorrent Error: " + err);
		})
		
		torrent.on('done', function ()
		{
			Id2Web.downloadDone(torrent);
		});

		torrent.on('wire', Id2Web.onWire);

		Id2Web.processView();
	},

	processView: function()
	{
		var torrent = Id2Web.torrentGetCurrent();
		
		Id2Web.updateUI2();

		// File list		
		$("#files").empty()
		for (var f = 0; f < torrent.files.length; f++)
		{
			var file = torrent.files[f];

			var domFile = $("<div class='file'>");
			domFile.attr("data-name", Id2Web.hashString(file.name));
			domFile.text(Id2Web.getLang("file.stats", file.name, Id2Web.bytesToStr(file.length)));
			$("#files").append(domFile);

			var domFileOpen = $("<a href='#' class='file-open hover-effect disabled tooltip-bottom'></a>");
			domFileOpen.attr("data-tooltip",Id2Web.getLang("tooltip.file-open"));
			domFile.append(domFileOpen);

			var domFileSave = $("<a href='#' class='file-save hover-effect disabled tooltip-bottom'></a>");
			domFileSave.attr("data-tooltip",Id2Web.getLang("tooltip.file-save"));
			domFile.append(domFileSave);
		}

		Id2Web.changeView()
	},

	changeView: function()
	{
		// Cleaning		
		$("#viewer").empty()
		$("#viewer").removeClass("viewer-primary")		
		

		for(var t=0;t<Id2Web.pendingDomTrack.length;t++)
			Id2Web.pendingDomTrack[t].remove()
		Id2Web.pendingDomTrack = []
		
		// Start
		var torrent = Id2Web.torrentGetCurrent();		

		var layout = Id2Web.params["layout"]

		// Detect view type

		// Logic:
		// Some extension are "primary", if exists only one file 'primary', preview it and ignore the others.
		// If contain srt files, connect to primary video.

		var files = [];
		var nPrimary = 0;
		var mainFile = '';
		var waitMainFile = false;
		var domVideo = null;

		for (var f = 0; f < torrent.files.length; f++)
		{
			var file = torrent.files[f];
			files.push(file);
			
			if(torrent.files.length == 1)
				isPrimary = true;

			if(Id2Web.matchExtension(file.name, Id2Web.extensions.primary) != "")
			{
				/*
				if(file.name.split('.').slice(0, -1).join('.').endsWith("thumb"))
					continue
				*/

				if(mainFile == '')
					mainFile = file.name;
				nPrimary++;
			}				
		}
		
		if(nPrimary>1)
			mainFile = '';
			
		if(torrent.files.length == 1)
			mainFile = torrent.files[0].name;

		// Sorting					
		files.sort(function(fileA, fileB)
		{
			var nameA = fileA.name.substr(0, fileA.name.lastIndexOf('.')).toLowerCase();
			var nameB = fileB.name.substr(0, fileB.name.lastIndexOf('.')).toLowerCase();
			var extA = fileA.name.substr(fileA.name.lastIndexOf('.')+1).toLowerCase();
			var extB = fileB.name.substr(fileB.name.lastIndexOf('.')+1).toLowerCase();
			var iA = Id2Web.extensions.order.indexOf(extA);
			var iB = Id2Web.extensions.order.indexOf(extB);
			if( (nameA == "readme") || (nameA == "index") )
				iA = 0;
			if( (nameB == "readme") || (nameB == "index") )
				iB = 0;	
			if(iA == -1) iA = 99999;
			if(iB == -1) iB = 99999;

			if(iA == iB)
				return (fileA.name == fileB.name ? 0 : (fileA.name>fileB.name ? 1:-1));
			else
				return iA>iB ? 1:-1;
		});		

		if(mainFile != '')
			$("#layout-auto").removeClass("disabled")

		if( (layout == "auto") && (mainFile == '') )			
			layout='list'

		if(Id2Web.params["layout"] == "list")
			mainFile = '';
		if(Id2Web.params["layout"] == "binary")
			mainFile = '';
		
		$("#layout-list").removeClass("disabled");
		$("#layout-binary").removeClass("disabled");
		$("#layout-none").removeClass("disabled");

		$("#layout-auto").removeClass("current");
		$("#layout-list").removeClass("current");
		$("#layout-binary").removeClass("current");
		$("#layout-none").removeClass("current");
		$("#layout-" + layout).addClass("current");

		$("#viewer").attr("data-layout", layout)

		if(mainFile != '')
			Id2Web.setDocumentTitle(mainFile);
		else
			Id2Web.setDocumentTitle(Id2Web.getLang('files.multiple'))

		if(layout != "none")
		{
			// Build view			
			Id2Web.message(Id2Web.getLang("steps.render.title"),Id2Web.getLang("steps.render.subtitle"));

			if(layout == 'auto')
				$("#viewer").addClass("viewer-primary");
			
			for (var f = 0; f < files.length; f++)
			{
				var file = files[f];				
				
				var subtitleExt = Id2Web.matchExtension(file.name, Id2Web.extensions.subtitles);
				if(subtitleExt != "")
				{					
					var fn = function (err, buffer)
					{
						if (err)
							Id2Web.log(err);
						else
						{
							var domTrack = $("<track>");
							domTrack.attr("label", arguments.callee.file.name);
							domTrack.attr("kind", "subtitles");
							
							var t = buffer.toString();
							if(arguments.callee.ext == "srt")
								t = Id2Web.srt2webvtt(t);	
							domTrack.attr('src','data:text/vtt,' + encodeURIComponent(t));
							
							Id2Web.pendingDomTrack.push(domTrack)
						}
					};
					fn.ext = subtitleExt;
					fn.file = file;
					file.getBuffer(fn);												
				}

				if( (mainFile != '') && (file.name != mainFile) )
					continue;

				if(layout == "binary")
					$("#viewer").append(Id2Web.buildFileContentBinary(files[f]))
				else if(layout == "auto")
				{
					var domItem = Id2Web.buildFileContent(files[f])
					$("#viewer").append(domItem)
					if(domItem.data('show-wait'))
						$("#viewer").append("<div class='wait'></div>");
				}
				else
				{
					var domItemRow = $("<div class='itemrow'></div>")
					var domItemRowTitle = $("<div class='title'></div>")
					domItemRowTitle.text(file.name)
					domItemRow.append(domItemRowTitle)
					$("#viewer").append(domItemRow)
					var domItem = Id2Web.buildFileContent(files[f])
					domItemRow.append(domItem)
					if(domItem.data('show-wait'))
						domItemRow.append("<div class='wait'></div>");
				}
			}
		}

		Id2Web.message("","");
	},

	buildFileContent: function(file)
	{
		// TODO: Reimplement WebTorrent "appendTo" for better customization
		// Missing for video/audio/pdf, study how streaming works
		var nameLower = file.name.toLowerCase();		
		var ext = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();

		if(Id2Web.matchExtension(file.name, Id2Web.extensions.markdown) != "")		
		{
			var domItem = $("<div class='item'>");
			domItem.data('show-wait', true)
			file.getBuffer(function (err, buffer) {
				if (err)
					Id2Web.log(err);
				else
				{
					var domMarkdown = $("<div class='markdown'></div>");
					var text = buffer.toString();										
					domMarkdown.html(marked(text));
					domItem.empty();
					domItem.append(domMarkdown);
					domItem.parent().children('.wait').remove()
				}
			});
			return domItem;
		}
		else if(Id2Web.matchExtension(file.name, Id2Web.extensions.bbcode) != "")		
		{
			var domItem = $("<div class='item'>");
			domItem.data('show-wait', true)
			file.getBuffer(function (err, buffer) {
				if (err)
					Id2Web.log(err);
				else
				{
					var domBBCode = $("<div class='bbcode'></div>");
					var text = buffer.toString();										
					domBBCode.html(Id2Web.bbToHtml(text));
					domItem.empty();
					domItem.append(domBBCode);
					domItem.parent().children('.wait').remove()
				}
			});
			return domItem;
		}
		else if(Id2Web.matchExtension(file.name, Id2Web.extensions.image) != "")		
		{
			var domItem = $("<div class='item'>");
			domItem.data('show-wait', true)
			file.getBlobURL(function (err, url) {
				if (err)
					Id2Web.log(err);
				else
				{
					var domImg = $("<img>");					
					domImg.attr("title", file.name);
					domImg.attr("alt", file.name);
					domImg.attr("src", url);
					domItem.empty();
					domItem.append(domImg);
					domItem.parent().children('.wait').remove()
				}
			});		
			return domItem;	
		}
		else if(Id2Web.matchExtension(file.name, Id2Web.extensions.pre) != "")		
		{
			var domItem = $("<div class='item'>");
			domItem.data('show-wait', true)
			file.getBuffer(function (err, buffer) {
				if (err)
					Id2Web.log(err);
				else
				{
					var domPre = $("<pre></pre>");					
					domPre.text(buffer);
					domItem.empty();
					domItem.append(domPre);
					domItem.parent().children('.wait').remove()
				}
			});		
			return domItem;	
		}
		else if( (Id2Web.matchExtension(file.name, Id2Web.extensions.video) != "") ||
		         (Id2Web.matchExtension(file.name, Id2Web.extensions.audio) != "") ||
				 (Id2Web.matchExtension(file.name, Id2Web.extensions.iframe) != "") )
		{
			var domItem = $("<div class='item'>");			
			file.appendTo(domItem.get(0), {
				maxBlobLength: 2 * 1000 * 1000 * 1000 // 2 GB
			}, function (err, elem) {
				if (err) Id2Web.log(err);
			});
			return domItem;
		}		
		else if(Id2Web.matchExtension(file.name, Id2Web.extensions.html) != "")		
		{
			var domItem = $("<div class='item'>");
			domItem.data('show-wait', true)
			file.getBuffer(function (err, buffer) {
				if (err)
					Id2Web.log(err);
				else
				{
					var html = buffer.toString();

					var iframe = document.createElement('iframe');
					
					domItem.empty();
					domItem.append($(iframe));
					domItem.parent().children('.wait').remove()

					iframe.contentWindow.document.open();
					iframe.contentWindow.document.write(html);
					iframe.contentWindow.document.close();
	
					var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
	
					var subViews = innerDoc.getElementsByTagName("iframe");
					for (var s = 0; s < subViews.length; s++)
					{
						var subIframe = subViews[s];
						var subId = subIframe.getAttribute("data-id");
						if(subId != null)
						{
							subIframe.src = window.location.href.split('?')[0] + "?id=" + subId + "&autoplay=false";
						}
					}					

					Id2Web.renderNormalize($(innerDoc));										

					
				}
			});
			return domItem;
		}
		else // Binary file
		{
			return Id2Web.buildFileContentBinary(file);
		}
	},

	buildFileContentBinary: function(file)
	{
		var domFile = $("<div class='file'>");
		domFile.attr("data-name", Id2Web.hashString(file.name));
		domFile.text(Id2Web.getLang("file.stats", file.name, Id2Web.bytesToStr(file.length)));
		$("#viewer").append(domFile);

		var domFileOpen = $("<a href='#' class='file-open hover-effect disabled tooltip-bottom'></a>");
		domFileOpen.attr("data-tooltip",Id2Web.getLang("tooltip.file-open"));
		domFile.append(domFileOpen);
		domFileOpen.data("file", file);
		domFileOpen.click(function() {
			Id2Web.fileOpenInNewTab($(this).data("file"));
		});

		var domFileSave = $("<a href='#' class='file-save hover-effect disabled tooltip-bottom'></a>");
		domFileSave.attr("data-tooltip",Id2Web.getLang("tooltip.file-save"));
		domFile.append(domFileSave);
		domFileSave.data("file", file);
		domFileSave.click(function() {
			Id2Web.fileDownload($(this).data("file"));
		});

		return domFile;
	},

	renderWait: function(domParent, file)
	{
		// Add a visible wait animation
		domParent.append("<div class='wait'>" + file.name + "</div>");
	},

	renderNormalize: function(domItem)
	{
		// Adaptation.

		// Normal links must be refer to parent container
		domItem.find('a').each(function()
		{
			var href = $(this).attr("href");
			var target = $(this).attr("target");
			if( (target == null) && (href != null) && (href != '#') )
			{
				$(this).attr("target","_parent");
			}
		});
	},

	downloadDone: function(torrent)
	{		
		Id2Web.updateUiTorrentLink(torrent)

		Id2Web.updateUI2()
	},

	onWire: function(wire)
	{		
		if(Id2Web.graph != null)
		{
			var id = wire.peerId.toString();
			Id2Web.graph.add({ id: id, name: wire.remoteAddress || 'Unknown' });
			Id2Web.graph.connect('You', id);
			wire.once('close', function () {
				if(Id2Web.graph != null)
				{
					Id2Web.graph.disconnect('You', id);
					Id2Web.graph.remove(id);
				}
			})
		}
	},

	peersGraphShow: function()
	{
		var torrent = Id2Web.torrentGetCurrent();
		if(torrent == null)
			return;

		var domPeersGraph = $("<div id='peers-graph'></div>");
		$("#main-area").parent().append(domPeersGraph);
		
		var w = $("#main-area").width();
		var h = $("#main-area").height();
		var sizeX = $("#peers").position().left;				
		domPeersGraph.css("position","absolute");
		h -= $("#peers").position().top;
		h -= $("#peers").outerHeight(true);		
		domPeersGraph.css("top",$("#peers").offset().top + $("#peers").height());
		domPeersGraph.css("left",$("#peers").offset().left);
		//domPeersGraph.css("width","100%"); // Fit in main-area
		//domPeersGraph.css("height", h); // Fit in main-area
		domPeersGraph.css("width",w); // Square version
		domPeersGraph.css("height",w); // Square version
				
		Id2Web.graph = new window.P2PGraph(domPeersGraph.get(0));
		Id2Web.graph.add({ id: 'You', name: 'You', me: true });
		
		// Note: i hack p2pgraph.min.js to replace
		// "self._height = window.innerWidth >= 900 ? 400 : 250" with "self._height = window.innerHeight".
		
		domPeersGraph.hide();
		
		domPeersGraph.fadeIn(500, function() {			
		});
				
		for(var w=0;w<torrent.wires.length;w++)
		{
			Id2Web.onWire(torrent.wires[w]);
		}
	},

	peersGraphHide: function () {
		$("#peers-graph").fadeOut(500, function() {
			if(Id2Web.graph != null)
			{
				Id2Web.graph.destroy();
				Id2Web.graph = null;
			}
		});
	},

	fileDownload: function(file) {
		var f = function (err, url)
		{
			if (err)
				Id2Web.log(err);
			else
			{
				var a = $("<a style='display: none;'/>");
				a.attr("href", url);
				a.attr("download", arguments.callee.file.name);
				$("body").append(a);
				a[0].click();
				a.remove();
			}
		};
		f.file = file;

		file.getBlobURL(f);
	},

	fileOpenInNewTab: function(file) {
		var f = function (err, url)
		{
			if (err)
				Id2Web.log(err);
			else
			{
				var a = $("<a style='display: none;'/>");
				a.attr("href", url);
				a.attr("target", "_blank");
				$("body").append(a);
				a[0].click();
				a.remove();
			}
		};
		f.file = file;

		file.getBlobURL(f);
	},

	/* ----------------------------------
	Fetch Methods
	---------------------------------- */

	fetchBitcoinInsightTransactionData: function(address, serviceName, subtitle, apiUrl) {
		Id2Web.message(Id2Web.getLang("steps.blockchain.title", serviceName), Id2Web.getLang("steps.blockchain.subtitle", subtitle, address));
		var url = apiUrl + "/tx/" + address;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function () {
			if (xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				if(data.vout != null)
				{
					for (var j = 0; j < data.vout.length; j++) {
						var vinAddr = data.vin[0].addr;
						var scriptPubKey = data.vout[j].scriptPubKey.asm;
						if (scriptPubKey.indexOf('OP_RETURN') !== -1) {
							var data = scriptPubKey.split(' ').slice(-1)[0];
							data = Id2Web.hex2ascii(data);
							Id2Web.playData(data);
							return;
						}
					}
				}
			}
			else {
				Id2Web.log('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	},

	fetchBitcoinInsightAddressData: function(address, serviceName, subtitle, apiUrl) {
		Id2Web.message(Id2Web.getLang("steps.blockchain.title", serviceName), Id2Web.getLang("steps.blockchain.subtitle", subtitle, address));
		var url = apiUrl + "/txs/?address=" + address;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function () {
			if (xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				for (var i = 0; i < data.txs.length; i++) {
					if (data.txs[i].vin.length > 0 && data.txs[i].vin[0].addr === address) { // only read transaction sent from CONFIG.btcAddress
						for (var j = 0; j < data.txs[i].vout.length; j++) {
							var vinAddr = data.txs[i].vin[0].addr;
							var scriptPubKey = data.txs[i].vout[j].scriptPubKey.asm;
							if (scriptPubKey.indexOf('OP_RETURN') !== -1) {
								// extract webpage torrent info hash
								var data = scriptPubKey.split(' ').slice(-1)[0];
								Id2Web.playData(data);
								return;
							}
						}
					}
				}
			}
			else {
				Id2Web.log('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	},

	fetchBitcoinCashInsightTransactionData: function(address, serviceName, subtitle, apiUrl) {
		Id2Web.message(Id2Web.getLang("steps.blockchain.title", serviceName), Id2Web.getLang("steps.blockchain.subtitle", subtitle, address));
		var url = apiUrl + "/tx/" + address;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function () {
			if (xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				if(data.vout != null)
				{
					for (var j = 0; j < data.vout.length; j++) {
						var vinAddr = data.vin[0].addr;
						var scriptPubKey = data.vout[j].scriptPubKey.asm;
						if (scriptPubKey.indexOf('OP_RETURN') !== -1) {
							var data = scriptPubKey.split(' ').slice(-1)[0];
							data = Id2Web.hex2ascii(data);
							Id2Web.playData(data);
							return;
						}
					}
				}
			}
			else {
				Id2Web.log('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	},

	fetchBitcoinCashInsightAddressData: function(address, serviceName, subtitle, apiUrl) {
		Id2Web.message(Id2Web.getLang("steps.blockchain.title", serviceName), Id2Web.getLang("steps.blockchain.subtitle", subtitle, address));
		var url = apiUrl + "/txs/?address=" + address;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function () {
			if (xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				for (var i = 0; i < data.txs.length; i++) {
					if (data.txs[i].vin.length > 0 && data.txs[i].vin[0].addr === bchaddr.toCashAddress(address)) { // only read transaction sent from CONFIG.btcAddress
						for (var j = 0; j < data.txs[i].vout.length; j++) {
							var vinAddr = data.txs[i].vin[0].addr;
							var scriptPubKey = data.txs[i].vout[j].scriptPubKey.asm;
							if (scriptPubKey.indexOf('OP_RETURN') !== -1) {
								// extract webpage torrent info hash
								var data = scriptPubKey.split(' ').slice(-1)[0];
								data = Id2Web.hex2ascii(data);
								Id2Web.playData(data);
								return;
							}
						}
					}
				}
			}
			else {
				Id2Web.log('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	},
	/*
	// TOFIX: Don't have OP_RETURN data?
	fetchBchBtcDotComAddressData: function(address, serviceName, apiUrl) {
		Id2Web.message("Looking for " + serviceName, subtitle + " about address " + address);
		https://bch-chain.api.btc.com/v3/address/13sMAwAwK624CVJzGnro6QxqnhpXbieZ8F/tx
		var url = apiUrl + "/v3/address/" + address + "/tx";
		console.log(url);
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.onload = function () {
			if (xhr.status === 200) {
				var data = JSON.parse(xhr.responseText);
				if(data.err_msg == null)
				{
					for (var l = 0; l < data.data.list.length; l++) {

						var skip = false;
						for (var i = 0; i < data.data.list[l].outputs.length; i++) {
							for (var a = 0; a < data.data.list[l].outputs[i].addresses.length; a++) {
								alert(data.data.list[l].outputs[i].addresses[a]);
								if(data.data.list[l].outputs[i].addresses[a] == address)
								{
									// If is versus the ID, ignore.
									// Need to be SEND from ID.
									alert("skip:" + address);
									skip = true;
								}
							}
						}

						if(skip)
							break;

						for (var i = 0; i < data.data.list[l].inputs.length; i++) {
							for (var a = 0; a < data.data.list[l].inputs[i].prev_addresses.length; a++) {
								alert(data.data.list[l].inputs[i].prev_addresses[a]);
								if(data.data.list[l].inputs[i].prev_addresses[a] == address)
								{
									alert('found:');
									//Id2Web.playData(data);

									return;
								}
							}
						}
						//			Id2Web.playData(data);


					}
				}
				else
				{
					Id2Web.log('Request failed.  BchBtcDotCom fail: ' + data.err_msg);
				}
			}
			else {
				Id2Web.log('Request failed.  Returned status of ' + xhr.status);
			}
		};
		xhr.send();
	},
	*/

	/* ----------------------------------
	Utils
	---------------------------------- */

	log: function(msg)
	{
		// instanceId is used to distinguish instances for example in a html with embedded content.
		console.log("search-id (" + Id2Web.instanceId + "): " + msg);
	},

	matchExtension: function(filename, extensions)
	{
		for(var e=0;e<extensions.length;e++)
			if(filename.toLowerCase().endsWith("." + extensions[e].toLowerCase()))
				return extensions[e].toLowerCase();
		return "";
	},

	getLang: function(id)
	{
		var t = "{" + id + "}"
		var langs = [];
		for(var l=0;l<navigator.languages.length;l++)
			langs.push(navigator.languages[l]);
		langs.push("en");
		
		for(var l=0;l<langs.length;l++)
		{
			var code = langs[l];			

			if(code in Id2Web.lang)
			{
				if(id in Id2Web.lang[code])
				{
					t = Id2Web.lang[code][id];
					break;
				}
			}
		}

		for(var p=1;p<arguments.length;p++)
			t = t.replace("{"+p+"}", arguments[p]);

		return t;
	},

	getParamsFromUrl: function(defaults)
	{
		var result = {};
		var query = location.search.substr(1);
		if (query.indexOf("=") == -1) // Without option, is a direct ID
		{
			result["id"] = decodeURIComponent(query);			
		}
		else {
			query.split("&").forEach(function (part) {
				var item = part.split("=");
				var key = item[0];
				var value = decodeURIComponent(item[1]);
				if (key == "autoplay") value = (value == "true");
				result[key] = value;
			});
		}
		for (var k in defaults) {
			if (result.hasOwnProperty(k) == false) {
				result[k] = defaults[k];
			}
		}
		return result;
	},

	millisecondsToStr: function(milliseconds) {		
		if(isFinite(milliseconds) == false)
			return Id2Web.getLang("time.unknown")

		var temp = Math.floor(milliseconds / 1000);
		var years = Math.floor(temp / 31536000);
		if (years) {
			return years + " " + Id2Web.getLang("time.year") + " " + Id2Web.getLang("time.remain");
		}
		var days = Math.floor((temp %= 31536000) / 86400);
		if (days) {
			return days + " " + Id2Web.getLang("time.day") + " " + Id2Web.getLang("time.remain");
		}
		var hours = Math.floor((temp %= 86400) / 3600);
		if (hours) {
			return hours + " " + Id2Web.getLang("time.hour") + " " + Id2Web.getLang("time.remain");
		}
		var minutes = Math.floor((temp %= 3600) / 60);
		if (minutes) {
			return minutes + " " + Id2Web.getLang("time.minute") + " " + Id2Web.getLang("time.remain");
		}
		var seconds = temp % 60;
		if (seconds) {
			return seconds + " " + Id2Web.getLang("time.second") + " " + Id2Web.getLang("time.remain");
		}
		return '';
	},

	bytesToStr: function(bytes, si)
	{
		var thresh = si ? 1000 : 1024;
		if(Math.abs(bytes) < thresh) {
			return bytes + ' B';
		}
		var units = si
			? ['kB','MB','GB','TB','PB','EB','ZB','YB']
			: ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
		var u = -1;
		do {
			bytes /= thresh;
			++u;
		} while(Math.abs(bytes) >= thresh && u < units.length - 1);
		return bytes.toFixed(1)+' '+units[u];
	},

	hex2ascii: function(str)
	{
		var hex  = str.toString();
		var str = '';
		for (var n = 0; n < hex.length; n += 2) {
			str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
		}
		return str;
	},

	inIframe: function()
	{
		try
		{
			return window.self !== window.top;
		} catch (e)
		{
			return true;
		}
	},

	htmlEncode: function (value)
	{
		// Create a in-memory div, set it's inner text(which jQuery automatically encodes) then grab the encoded contents back out.
		return $('<div/>').text(value).html();
	},

	htmlDecode: function (value)
	{
		return $('<div/>').html(value).text();
	},

	hashString: function (str)
	{		
		return btoa(unescape(encodeURIComponent(str)))
	},

	bencodeDecode: function (b)
	{
		// TODO, not need for now
	},

	bbToHtml: function (value)
	{
		var result = Id2Web.htmlEncode(value);

		/*
		result = result.replaceAll("\r", "&#13;");
		result = result.replaceAll("\n", "&#10;");	
		*/	

		result = result.replaceAll("\\[","&lbrack;");
		result = result.replaceAll("\\]","&rbrack;");

		// I use [\s\S] and not . to match multiline.
		result = result.replace(/\[code\]([\s\S]+?)\[\/code\]/g, function(match, contents, offset, input_string)
			{    	
				//return "[code]" + match.replaceAll("[","&lbrack;").replaceAll("]","&rbrack;") + "[/code]";
				return "<pre class=\"bbc_code\">" + match.substring(6,match.length-7).replaceAll("[","&lbrack;").replaceAll("]","&rbrack;") + "</pre>";
			}
		);

		result = result.replace(/\[nobr\]([\s\S]+?)\[\/nobr\]/g, function(match, contents, offset, input_string)
			{    	
				return match.substring(6,match.length-7).replaceAll("\r"," ").replaceAll("\n"," ");
			}
		);

		result = result.replace(/\[br\]/g, "<br>");
		result = result.replace(/\[hr\]/g, "<hr>");
		result = result.replace(/\[b\]/g, "<b>");
		result = result.replace(/\[\/b\]/g, "</b>");
		result = result.replace(/\[i\]/g, "<i>");
		result = result.replace(/\[\/i\]/g, "</i>");
		result = result.replace(/\[s\]/g, "<del>");
		result = result.replace(/\[\/s\]/g, "</del>");
		result = result.replace(/\[del\]/g, "<del>");
		result = result.replace(/\[\/del\]/g, "</del>");
		result = result.replace(/\[u\]/g, "<span class=\"bbc_underline\">");
		result = result.replace(/\[\/u\]/g, "</span>");		
		result = result.replace(/\[sub\]/g, "<sub>");
		result = result.replace(/\[\/sub\]/g, "</sub>");
		result = result.replace(/\[sup\]/g, "<sup>");
		result = result.replace(/\[\/sup\]/g, "</sup>");		
		result = result.replace(/\[highlight\]/g, "<span class=\"bbc_highlight\">");
		result = result.replace(/\[\/highlight\]/g, "</span>");		
		result = result.replace(/\[left\]/g, "<div class=\"bbc_left\">");
		result = result.replace(/\[\/left\]/g, "</div>");
		result = result.replace(/\[right\]/g, "<div class=\"bbc_right\">");
		result = result.replace(/\[\/right\]/g, "</div>");
		result = result.replace(/\[center\]/g, "<div class=\"bbc_center\">");
		result = result.replace(/\[\/center\]/g, "</div>");
		result = result.replace(/\[justify\]/g, "<div class=\"bbc_justify\">");
		result = result.replace(/\[\/justify\]/g, "</div>");

		result = result.replace(/\[h([1-6])\]/g, "<h$1>");
		result = result.replace(/\[\/h([1-6])\]/g, "</h$1>");

		result = result.replace(/\[table=(.*?)\]/g, "<table style='width:$1' class=\"bbc_table\">");
		result = result.replace(/\[table\]/g, "<table class=\"bbc_table\">");
		result = result.replace(/\[tr\]/g, "<tr>");
		result = result.replace(/\[\/tr\]/g, "</tr>");		
		result = result.replace(/\[td\]/g, "<td>");
		result = result.replace(/\[\/td\]/g, "</td>");
		result = result.replace(/\[th\]/g, "<th>");
		result = result.replace(/\[\/th\]/g, "</th>");
		result = result.replace(/\[thead\]/g, "<thead>");
		result = result.replace(/\[\/thead\]/g, "</thead>");
		result = result.replace(/\[tbody\]/g, "<tbody>");
		result = result.replace(/\[\/tbody\]/g, "</tbody>");
		result = result.replace(/\[\/table\]/g, "</table>");

		result = result.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, "<span style='color:$1'>$2</span>");
		
		result = result.replace(/\[size=([1-9])\](.*?)\[\/size\]/g, "<span style='font-size:$1em'>$2</span>");
		result = result.replace(/\[size=(.*?)\](.*?)\[\/size\]/g, "<span style='font-size:$1'>$2</span>");

		/*
		if(questionData != null)
		{
			result = result.replace(/\[img=(.*?)\](.*?)\[\/img\]/g, "<img style='width:$1;vertical-align:middle;' src='/platform/questions/" + questionData.id + "/$2'>");
		}
		*/

		result = result.replace(/\[img=(.*?)\]/g, "<img src='$1'>");
		result = result.replace(/\[img\](.*?)\[\/img\]/g, "<img src='$1'>");
		result = result.replace(/\[url\](.*?)\[\/url\]/g, "<a target='_parent' href='$1'>$1</a>");
		result = result.replace(/\[url=(.*?)\](.*?)\[\/url\]/g, "<a target='_parent' href='$1'>$2</a>");

		// List
		result = result.replace(/\[ol\]/g, "<ol>");
		result = result.replace(/\[\/ol\]/g, "</ol>");
		result = result.replace(/\[ul\]/g, "<ul>");
		result = result.replace(/\[\/ul\]/g, "</ul>");
		result = result.replace(/\[li\]/g, "<li>");
		result = result.replace(/\[\/li\]/g, "</li>");

		// Remove wrong spaces between some tags, otherwise \n -> <br> below insert wrong tags.
		result = result.replace(/\<ul\>\s+\<li\>/g, "<ul><li>"); 		
		result = result.replace(/\<ol\>\s+\<li\>/g, "<ol><li>"); 
		result = result.replace(/\<\/li\>\s+\<li\>/g, "</li><li>"); 
		result = result.replace(/\<\/li\>\s+\<\/ul\>/g, "</li></ul>"); 
		result = result.replace(/\<\/li\>\s+\<\/ol\>/g, "</li></ol>"); 		
		result = result.replace(/\>\s+\<tr\>/g, "><tr>"); 
		result = result.replace(/\<\/tr\>\s+\<tr\>/g, "</tr><tr>"); 
		result = result.replace(/\<\/tr\>\s+\<\/table\>/g, "</tr></table>"); 		
		result = result.replace(/\<\/td\>\s+\<td\>/g, "</td><td>"); 
		result = result.replace(/\<\/th\>\s+\<td\>/g, "</th><td>"); 
		result = result.replace(/\<\/th\>\s+\<th\>/g, "</th><th>"); 		
		result = result.replace(/\<\/td\>\s+\<\/tr\>/g, "</td></tr>"); 
		result = result.replace(/\<\/th\>\s+\<\/tr\>/g, "</th></tr>"); 
		result = result.replace(/\<tr\>\s+\<td\>/g, "<tr><td>"); 

		// Return
		result = result.replace(/\n/g, "<br>");

		return result;
	},

	// https://github.com/silviapfeiffer/silviapfeiffer.github.io
	srt2webvtt:function(data) {
		// remove dos newlines
		var srt = data.replace(/\r+/g, '');
		// trim white space start and end
		srt = srt.replace(/^\s+|\s+$/g, '');
		// get cues
		var cuelist = srt.split('\n\n');
		var result = "";
		if (cuelist.length > 0) {
			result += "WEBVTT\n\n";
			for (var i = 0; i < cuelist.length; i=i+1) {
				result += Id2Web.convertSrtCue(cuelist[i]);
			}
		}
		return result;
	},

    convertSrtCue:function(caption) {
		// remove all html tags for security reasons
		//srt = srt.replace(/<[a-zA-Z\/][^>]*>/g, '');
		var cue = "";
		var s = caption.split(/\n/);
		// concatenate muilt-line string separated in array into one
		while (s.length > 3) {
			for (var i = 3; i < s.length; i++) {
				s[2] += "\n" + s[i]
			}
			s.splice(3, s.length - 3);
		}
		var line = 0;
		// detect identifier
		if (!s[0].match(/\d+:\d+:\d+/) && s[1].match(/\d+:\d+:\d+/)) {
			cue += s[0].match(/\w+/) + "\n";
			line += 1;
		}
		// get time strings
		if (s[line].match(/\d+:\d+:\d+/)) {
			// convert time string
			var m = s[1].match(/(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/);
			if (m) {
				cue += m[1]+":"+m[2]+":"+m[3]+"."+m[4]+" --> "
				+m[5]+":"+m[6]+":"+m[7]+"."+m[8]+"\n";
				line += 1;
			} else {
				// Unrecognized timestring
				return "";
			}
		} else {
			// file format error or comment lines
			return "";
		}
		// get cue text
		if (s[line]) {
			cue += s[line] + "\n\n";
		}
		return cue;
	}
}

/* -------------------------------
Polyfill
------------------------------- */
if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function(search, replacement) {
		var target = this;
		return target.split(search).join(replacement);
	};
}

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}
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
	version: "0.3α",
	instanceId: parseInt(Math.random()*10000),
	lang: {},
	params: null,
	graph: null,
	speedDownLast: 0,
	speedDownTime: 0,
	speedUpLast: 0,
	speedUpTime: 0,
	playTime: 0,
	fetchMethods: {},

	start: function () {

		console.log("search-id (" + Id2Web.instanceId + "): Version " + Id2Web.version);
		this.params = this.getParamsFromUrl({ id: '', autoplay: true, layout: 'view', direct: false, file: '', ws: '' });
		console.log("search-id (" + Id2Web.instanceId + "): Options", this.params);		

		if (this.params["id"] == "")
			this.params["id"] = this.home;

		this.params["id"] = this.params["id"];

		$("#main-open").fadeIn();
		$("#main-area").hide();
		
		$(".link-copy").attr("data-tooltip",Id2Web.getLang("tooltip.copy-clipboard"));
		$(".link-copy").click(function(){
			var copyText = $(this).data("copy-text");
			prompt("Copy to clipboard", copyText);
		});

		$("#nav .home").attr("data-tooltip",Id2Web.getLang("tooltip.home"));
		$("#nav .home").click(function(){
			Id2Web.params["id"] = Id2Web.home;
			Id2Web.updateUI();
			Id2Web.play();
		});

		$("#nav .add").attr("data-tooltip",Id2Web.getLang("tooltip.add"));
		$("#nav .add").click(function(){
			$("#files-upload").click();
		});

		$("#nav .search").attr("data-tooltip",Id2Web.getLang("tooltip.search"));
		$("#nav .search").click(function(){
			var id = $("#nav input").val();
			Id2Web.params["id"] = id;
			Id2Web.updateUI();
			Id2Web.play();
		});

		$("#nav input").keypress(function(event) {
			if (event.which == 13) {
				event.preventDefault();
				$("#nav .search").trigger("click");
			}
		});

		$("#nav input").attr("placeholder", Id2Web.home);
		
		$("#peers").click(function (e) {
			if( (Id2Web.torrent != null) && ($("#peers-graph").length == 0) )
			{
				Id2Web.peersGraphShow();
			}
			else
			{
				Id2Web.peersGraphHide();				
			}
		});
		/*
		$("#peers").mouseover(function (e) {
			if(Id2Web.torrent != null)
				Id2Web.peersGraphShow();
		});
		$("#peers").mouseout(function (e) {
			Id2Web.peersGraphHide();
		});
		*/

		$('#files-upload').hide();
		$('#files-upload').change(function (e) {
			e.preventDefault();

			var input = document.getElementById('files-upload');
			if(input.files.length>0)
				Id2Web.play(input.files);
		});

		$("#menu").click(function(){
			$("#main-area").fadeToggle();
		});

		$("#play").click(function(){
			Id2Web.play();
		});

		$("#version").text(Id2Web.version);		

		Id2Web.playTime = 0;

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

	updateUI: function()
	{
		if(Id2Web.params["id"] == Id2Web.home)
			$("#nav input").val("");
		else
			$("#nav input").val(Id2Web.params["id"]);

		// TOFIX: Build params if different from default.
		var newUrl = window.location.href.split('?')[0];

		if(Id2Web.params["id"] != Id2Web.home)
			newUrl += "?" + Id2Web.params["id"];

		// TOFIX: Probably 'back' button don't work well.
		window.history.pushState(null, null, newUrl);


		if($("#link-share").hasClass("link-active") == false)
			$("#link-share").addClass("link-active");
		$("#link-share input").val(newUrl);
		$("#link-share .link-copy").data("copy-text", newUrl);

		var embedHtml = "<iframe src=\"" + newUrl + "&autoplay=false\"></iframe>";
		if($("#link-embed").hasClass("link-active") == false)
			$("#link-embed").addClass("link-active");
		$("#link-embed input").val(embedHtml);
		$("#link-embed .link-copy").data("copy-text", embedHtml);

		this.updateUI2();
	},

	updateUI2: function()
	{
		var torrent = Id2Web.torrent;

		if(Id2Web.playTime == 0)
		{
			$("#status").text(Id2Web.getLang("status.waiting"));
			Id2Web.statusColor("white");
		}

		if(torrent == null)
		{
			$("#download").text("Download: -");
			$("#download").css("opacity",0.2);
			$("#download").css("background-size", "1.6em 1.6em, 0% 100%");
			$("#upload").text("Upload: -");
			$("#upload").css("opacity",0.2);
			$("#peers").text(Id2Web.getLang("stats.peers","?"));
			$("#peers").css("opacity",0.2);

			$("#files").empty();
		}
		else
		{
			var now = (new Date()).getTime();

			$("#peers").text(Id2Web.getLang("stats.peers",torrent.numPeers));
			$("#peers").css("opacity","");

			var upSpeed = 0;
			if (Id2Web.speedUpTime != 0)
				upSpeed = (torrent.uploaded - Id2Web.speedUpLast) / (now - Id2Web.speedUpTime) * 1000;
			Id2Web.speedUpTime = now;
			Id2Web.speedUpLast = torrent.uploaded;
			$("#upload").text(Id2Web.getLang("stats.upload", Id2Web.bytesToStr(torrent.uploaded, true), Id2Web.bytesToStr(upSpeed, false) + "/s"));
			$("#upload").css("opacity","");

			if(torrent.done == false)
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

				$("#status").text(Id2Web.getLang("status.seeding"));
				Id2Web.statusColor("green");
			}



			if(torrent.files != null)
			{
				for (var f=0;f<torrent.files.length;f++)
				{
					var file = torrent.files[f];

					var domFile = $(".file[data-name='" + file.name + "']");

					if(file.done)
					{
						if(domFile.hasClass("file-done") == false)
						{
							domFile.removeClass("file-pending");
							domFile.addClass("file-done");

							var f = function (err, url)
							{
								if (err)
									Id2Web.log(err);
								else
								{
									var filename = arguments.callee.domFile.attr("data-name");
									var domFileSave = arguments.callee.domFile.children(".file-save");
									domFileSave.attr("target", "_blank");
									domFileSave.attr("download", filename);
									domFileSave.attr("href", url);
									domFileSave.removeClass("disabled");

								}
							};
							f.domFile = domFile;

							file.getBlobURL(f);
						}
					}
					else
					{
						if(domFile.hasClass("file-pending") == false)
						{
							domFile.addClass("file-pending");
						}
					}
				}
			}
		}
	},

	statusColor: function(color)
	{
		if(color == "yellow")
		{
			color = "#d2d252";
		}
		else if(color == "white")
		{
			color = "#888888";
		}
		shadow = color;
		//shadow = "#444444";
		$("#main-area").css("border-left","1em solid " + color);
		$("#main-area").css("box-shadow","0px 0px 1em " + shadow);

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
		Id2Web.torrent = null;

		$("#play").fadeOut();

		$("#viewer").empty();

		Id2Web.playTime = (new Date()).getTime();

		Id2Web.updateUI2(null);

		if(files == null)
		{
			$("#status").text(Id2Web.getLang("status.searching"));
			Id2Web.statusColor("yellow");
			Id2Web.playData(this.params["id"]);
		}
		else
		{
			$("#status").text(Id2Web.getLang("status.upload"));
			Id2Web.statusColor("yellow");
			var client = new WebTorrent();
			client.seed(files, function(torrent) {
				Id2Web.params["id"] = torrent.infoHash;
				Id2Web.updateUI();
				Id2Web.buildMagnetLink(torrent.infoHash);
				Id2Web.processTorrent(torrent);
			});
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
		else if(id.startsWith("magnet:?")) {
			var m = id.match(/btih\:([0-9a-f]+)/i);
			if(m != null)
			{
				id=m[1];
				this.playInfoHash(id);
			}
			else
				Id2Web.message("Unknown magnet address format","<pre>" + id + "</pre>");
		}		
		else if(id.match(/btih\:([0-9a-f]+)/i) != null) {
			// EW magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d
			var id2 = id.match(/btih\:([0-9a-f]+)/i)[1];
			this.playInfoHash(id2);
		}
		else {
			Id2Web.message("Unknown address","<pre>" + id + "</pre>");
			$("#status").text(Id2Web.getLang("status.404"));
			Id2Web.statusColor("red");
		}
	},

	playInfoHash: function(id)
	{
		var magnet = Id2Web.buildMagnetLink(id);

		Id2Web.message("Searching", "infohash " + id);

		var client = new WebTorrent();

		client.add(magnet, Id2Web.processTorrent);
	},

	buildMagnetLink: function(id)
	{
		var magnet = "magnet:?xt=urn:btih:" + id;

		var trackers = Id2Web.trackers;

		if(Id2Web.params["trackers"] != "")
		{
			// TODO: override
		}
		for(var t=0;t<trackers.length;t++)
			magnet += "&tr=" + encodeURI(trackers[t]);

		if(Id2Web.params["ws"] != "")
			magnet += "&ws=" + encodeURI(Id2Web.params["ws"]);

		$("#link-magnet").addClass("link-active");
		$("#link-magnet input").val(magnet);
		$("#link-magnet .link-copy").data("copy-text", magnet);

		return magnet;
	},

	processTorrent: function(torrent)
	{
		Id2Web.torrent = torrent;
		
		torrent.on('error', function (err) {
			Id2Web.log(err);
		})
		
		torrent.on('done', function ()
		{
			Id2Web.downloadDone(torrent);
		});

		torrent.on('wire', Id2Web.onWire);

		Id2Web.updateUI2();

		if (Id2Web.params["layout"] == "auto")
		{
			if (torrent.files.length == 1)
				Id2Web.params["layout"] = "view";
			else
				Id2Web.params["layout"] = "list";
		}

		// File list
		$("#files").empty();
		for (var f = 0; f < torrent.files.length; f++)
		{
			var file = torrent.files[f];

			var domFile = $("<div class='file'>");
			domFile.attr("data-name", file.name);
			domFile.text(Id2Web.getLang("file.stats", file.name, Id2Web.bytesToStr(file.length)));
			$("#files").append(domFile);

			var domFileSave = $("<a href='#' class='file-save hover-effect disabled tooltip-bottom'></a>");
			domFileSave.attr("data-tooltip",Id2Web.getLang("tooltip.file-save"));
			domFile.append(domFileSave);
		}

		// Detect view type

		// Logic:
		// Some extension are "primary", if exists only one file 'primary', preview it and ignore the others.
		// If contain srt files, connect to primary video.

		var nPrimary = 0;
		var mainFile = -1;
		var waitMainFile = false;

		for (var f = 0; f < torrent.files.length; f++)
		{
			var file = torrent.files[f];
			var ext = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();

			var isPrimary = ["htm","html","mp4","webm","ogg","pdf"].includes(ext);
			var isStreamable = ["mp4","webm","ogg","pdf"].includes(ext);
			var isVideo = ["mp4"].includes(ext);

			if(torrent.files.length == 1)
				isPrimary = true;

			if(isPrimary)
			{
				if(mainFile == -1)
					mainFile = f;
				nPrimary++;
			}
			if(nPrimary>1)
			{
				mainFile = -1;
				break;
			}
		}


		// Build view
		$("#viewer").empty();
		$("#viewer").removeClass("viewer-primary");
		Id2Web.message("Building view");

		// First lap, main file
		if(mainFile != -1)
		{
			Id2Web.setDocumentTitle(torrent.files[mainFile].name);

			Id2Web.buildFileContent(torrent.files[mainFile]);
			$("#viewer").addClass("viewer-primary");
		}

		// Second lap, other files
		for (var f = 0; f < torrent.files.length; f++)
		{
			var file = torrent.files[f];

			// TODO: If .srt, connect to video

			if(mainFile == -1)
			{
				Id2Web.setDocumentTitle("Multiple files");
				Id2Web.buildFileContent(torrent.files[f]);
			}
		}

		Id2Web.message("");
	},

	buildFileContent: function(file)
	{
		// TODO: Reimplement WebTorrent "appendTo" for better customization
		var ext = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();

		if(["mp4","webm","ogg","pdf","png","jpg","jpeg","gif"].includes(ext))
		{
			return file.appendTo($("#viewer").get(0), {
				maxBlobLength: 2 * 1000 * 1000 * 1000 // 2 GB
			}, function (err, elem) {
				if (err) Id2Web.log(err);
			});
		}
		else if(["htm","html"].includes(ext))
		{
			file.getBuffer(function (err, buffer) {
				if (err)
					Id2Web.log(err);
				else
				{
					var html = buffer.toString();
	
					var iframe = document.createElement('iframe');
					$("#viewer").append($(iframe));
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
				}
			});
		}
		else
		{
			var domFile = $("<div class='file'>");
			domFile.attr("data-name", file.name);
			domFile.text(Id2Web.getLang("file.stats", file.name, Id2Web.bytesToStr(file.length)));
			$("#viewer").append(domFile);

			var domFileSave = $("<a href='#' class='file-save hover-effect disabled tooltip-bottom'></a>");
			domFileSave.attr("data-tooltip",Id2Web.getLang("tooltip.file-save"));
			domFile.append(domFileSave);

			var f = function (err, url)
			{
				if (err)
					Id2Web.log(err);
				else
				{
					var filename = arguments.callee.domFile.attr("data-name");
					var domFileSave = arguments.callee.domFile.children(".file-save");
					domFileSave.attr("target", "_blank");
					domFileSave.attr("download", filename);
					domFileSave.attr("href", url);
					domFileSave.removeClass("disabled");

				}
			};
			f.domFile = domFile;

			file.getBlobURL(f);
		}
	},

	downloadDone: function(torrent)
	{
		Id2Web.updateUI2();
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
		var domPeersGraph = $("<div id='peers-graph'></div>");
		$("#main-area").append(domPeersGraph);
		
		var h = $("#main-area").height();
		var sizeX = $("#peers").position().left;				
		domPeersGraph.css("position","absolute");
		if(sizeX<5000)
		{
			h -= $("#peers").position().top;
			h -= $("#peers").outerHeight(true);
			domPeersGraph.css("top",$("#peers").position().top + $("#peers").outerHeight(true));
			domPeersGraph.css("left","0px");
			domPeersGraph.css("width","100%");
			domPeersGraph.css("height", h);			
		}
		else
		{
			domPeersGraph.css("top","0px");
			domPeersGraph.css("left","0px");
			domPeersGraph.css("width",sizeX);
			domPeersGraph.css("height",h);			
		}
				
		Id2Web.graph = new window.P2PGraph(domPeersGraph.get(0));
		Id2Web.graph.add({ id: 'You', name: 'You', me: true });
		
		// Note: i hack p2pgraph.min.js to replace
		// "self._height = window.innerWidth >= 900 ? 400 : 250" with "self._height = window.innerHeight".
		
		domPeersGraph.hide();
		
		domPeersGraph.fadeIn(500, function() {			
		});
		
		for(var w=0;w<Id2Web.torrent.wires.length;w++)
		{
			Id2Web.onWire(Id2Web.torrent.wires[w]);
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

	/* ----------------------------------
	Fetch Methods
	---------------------------------- */

	fetchBitcoinInsightTransactionData: function(address, serviceName, subtitle, apiUrl) {
		Id2Web.message("Looking for " + serviceName, subtitle + " about transaction " + address);
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
		Id2Web.message("Looking for " + serviceName, subtitle + " about address " + address);
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
		Id2Web.message("Looking for " + serviceName, subtitle + " about transaction " + address);
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
		Id2Web.message("Looking for " + serviceName, subtitle + " about address " + address);
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
			result["id"] = query;
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
		function numberEnding(number) {
			return (number > 1) ? 's' : '';
		}
		var temp = Math.floor(milliseconds / 1000);
		var years = Math.floor(temp / 31536000);
		if (years) {
			return years + ' year' + numberEnding(years) + " remain";
		}
		var days = Math.floor((temp %= 31536000) / 86400);
		if (days) {
			return days + ' day' + numberEnding(days) + " remain";
		}
		var hours = Math.floor((temp %= 86400) / 3600);
		if (hours) {
			return hours + ' hour' + numberEnding(hours) + " remain";
		}
		var minutes = Math.floor((temp %= 3600) / 60);
		if (minutes) {
			return minutes + ' minute' + numberEnding(minutes) + " remain";
		}
		var seconds = temp % 60;
		if (seconds) {
			return seconds + ' second' + numberEnding(seconds) + " remain";
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
	}
}

<?php

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

function buildLog($msg, $fatal = false)
{
	$style = "padding:0.5em;margin:0.5em;border:1px solid gray;";
	if($fatal)
		$style .= "background-color:red;color:white;";
	echo "<div style='" . $style . "'>" . htmlentities($msg) . "</div>";
	if($fatal)
		throw new Exception($msg);
}

function buildReadFile($file)
{
	$content = file_get_contents($file);
	return $content;
}

function buildWriteFile($file, $content)
{
	file_put_contents($file, $content);
}

function buildReplace(&$out, $from, $to)
{
	if(strpos($out, $from) === false)
		buildLog("'" . $from . "' not found.", true);
		
	$out = str_replace($from, $to, $out);
}

function buildMinifyJS($js)
{
	// TODO
	return $js;
}

function buildMinifyCSS($css)
{
	// TODO
	return $css;
}

function main()
{
	try
	{
		buildLog("This script build search-id.min.html by merging external resources.");
		
		$out = buildReadFile("search-id.html");
		
		preg_match_all("/\<script src=\"(.*?)\"\>/", $out, $matchesJS);
		foreach ($matchesJS[1] as $js)
		{			
			buildLog("Found JS:" . $js);
			$ex = buildMinifyJS(buildReadFile($js));
			$out = str_replace("<script src=\"" . $js . "\">", "<script>" . $ex, $out);
		}
		
		//$cssScript = preg_match_all("/\<link rel=\"stylesheet\" type=\"text/css\" href=\"(.*?)\" \/\>/", $out, $matchesCSS);
		preg_match_all("/\<link rel=\"stylesheet\" type=\"text\/css\" href=\"(.*?)\" \/\>/", $out, $matchesCSS);
		foreach ($matchesCSS[1] as $css)
		{			
			buildLog("Found CSS:" . $css);
			$ex = buildMinifyCSS(buildReadFile($css));
			$out = str_replace("<link rel=\"stylesheet\" type=\"text/css\" href=\"" . $css . "\" />", "<style>" . $ex . "</style>", $out);
		}
		
		preg_match_all("/url\(\"(.+?)\"\)/", $out, $matchesUrlCSS);
		foreach ($matchesUrlCSS[1] as $css)
		{			
			buildLog("Found CSS Url:" . $css);
			
			$path = "embedded/" . $css;
			
			$mime = mime_content_type($path);
			$data = base64_encode(file_get_contents($path));
			$src = "data:" . $mime . ";base64," . $data;
			
			$out = str_replace("url(\"" . $css . "\")","url(" . $src . ")", $out);
			
			if( ($mime != "image/svg+xml") &&
			    ($mime != "image/png") )
				buildLog("Unexpected mime-type: " . $mime, true);
		}
		
		
		/*
		// TOFIX: With reg-ex can be better.
		buildReplace($out, "<script src=\"embedded/p2p-graph.min.js\"></script>", "<script>" . buildMinifyJS(buildReadFile("embedded/p2p-graph.min.js")) . "</script>");
		buildReplace($out, "<script src=\"embedded/jquery-3.3.1.min.js\"></script>", "<script>" . buildMinifyJS(buildReadFile("embedded/jquery-3.3.1.min.js")) . "</script>");
		buildReplace($out, "<script src=\"embedded/webtorrent.min.js\"></script>", "<script>" . buildMinifyJS(buildReadFile("embedded/webtorrent.min.js")) . "</script>");
		
		buildReplace($out, "<script src=\"embedded/search-id.js\"></script>", "<script>" . buildMinifyJS(buildReadFile("embedded/search-id.js")) . "</script>");
		buildReplace($out, "<script src=\"embedded/search-id.lang.en.js\"></script>", "<script>" . buildMinifyJS(buildReadFile("embedded/search-id.lang.en.js")) . "</script>");
		buildReplace($out, "<script src=\"embedded/search-id.lang.it.js\"></script>", "<script>" . buildMinifyJS(buildReadFile("embedded/search-id.lang.it.js")) . "</script>");		
		*/
		//buildReplace($out, "<link rel=\"stylesheet\" type=\"text/css\" href=\"embedded/search-id.css\" />", "<style>" . buildMinifyCSS(buildReadFile("embedded/search-id.css")) . "</style>");
		
		buildWriteFile("search-id.min.html", $out);
		
		buildLog("Build of search-id.min.html completed. " . strlen($out) . " bytes.");
	}
	catch (Exception $e)
	{
		buildLog("Build failed.");
	}
}

main();

?>
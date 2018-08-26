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

Id2Web.home = '13sMAwAwK624CVJzGnro6QxqnhpXbieZ8F';
Id2Web.fileSizeLimit = 2 * 1000 * 1000 * 1000; // 2GB
Id2Web.trackers = {
	always: [
		'wss://search-id.org/wss',
		'wss://tracker.btorrent.xyz',
		'wss://tracker.openwebtorrent.com',
		'udp://search-id.org:8000',
		'udp://explodie.org:6969',
		'udp://tracker.coppersurfer.tk:6969',
		'udp://tracker.empire-js.us:1337',
		'udp://tracker.leechers-paradise.org:6969',
		'udp://tracker.opentrackr.org:1337'
	],
	blacklist: [
		'udp://tracker.mg64.net:2710/announce',
		'udp://tracker.openbittorrent.com:80/announce',
		'udp://explodie.org:6969'
	]
}
Id2Web.pools = [
	{
		url:'https://search-id.org/pool',
		key:''
	}	
]
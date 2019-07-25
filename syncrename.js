#!/usr/bin/env node

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var fs = require('fs-extra'); //npm install fs-extra
const path = require('path');
var crypto = require('crypto');

function PrintHelp() {
	console.log("Usage: " + __filename + " [options] <dir(s)> <file(s)>\n"
		+ "	-R     | Recursively navigate directories.\n"
		+ "	--help | Print this help.\n\n"
		+ "Example: " + __filename + " /user/junk /mnt/stuff/things.txt\n");
	process.exit(-1);
}

if(process.argv.length <= 2) {
	PrintHelp();
}

var recursive = false;

//Function calculate SHA256.
function GetSHA256(inFile) {
	fs.createReadStream(inFile).pipe(crypto.createHash('sha256').setEncoding('hex')).on('finish', function () {
		return this.read();
	});
}

function ProcessFile(full_file) {
	//Find position of filename.
	var sync_index = full_file.indexOf(".sync-conflict-20");
	
	if(sync_index != -1) {
		var End = "";
		var Start = "";
		var Final = "";
		var part1 = full_file.substring(sync_index, full_file.length - sync_index);
		var Quote = part1.substring(1);

		//Function for finding the real extension of a filename.
		var Ext = () => {
			var my_temp_local_string = "";
			var my_temp_local_bool = false;

			//Go past the position of the dot in the ".sync-conflict-20" part of the filename.
			for(var i = sync_index + 1; i < full_file.length; i++) {
				if(full_file[i] == "." && !my_temp_local_bool) {
					my_temp_local_bool = true;
				}

				if(my_temp_local_bool === true) {
					my_temp_local_string += full_file[i];
				}
			}
			return my_temp_local_string;
		}
	
		Start = full_file.substring(0, sync_index);
		Final = Start + Ext();

		//Function for moving files.
		var DoMove = () => {
			fs.move(full_file, Final, {clobber: true}, function (err) {
				if(err) { console.error(err); }
				console.log('Successfully moved: ' + full_file + ' -> ' + Final);
			});
		}

		//Check if the file location we are moving to already exists.
		//We don't want a different file over-written.
		fs.access(Final,(err) => {
			//If the file we plan to move to doesn't exist.
			if(err) {
				DoMove();
			} else {
				//If it does exist, check the SHA256.
				if(GetSHA256(full_file) == GetSHA256(Final)) {
					DoMove();
				//If they are different files, we print to stderr and don't move anything.
				} else {
					console.error("File " + Final + " already exists, and is a different file entirely than " + full_file);
				}
			}
		});
	}
}

function ProcessPathArgs(current_path, basedir) {
	var IsRecursiveValid = () => {
		return(basedir || recursive);
	}

	//Function to check the details of the argument provided
	fs.lstat(current_path).then(stats => {
		//Take this logic if the path is determined to be a file.
		if(stats.isFile()) {
			ProcessFile(current_path);
		}
		
		//Check if recursion is valid.
		else if(stats.isDirectory() && IsRecursiveValid()) {
			//Read file list into array.
			fs.readdir(current_path).then(files => {
				//Feed every file into the ProcessFile() function.
				files.forEach(file => {
					ProcessPathArgs(path.join(current_path,file),false);
				});
			}).catch(err => {
				console.error(err);
			});
		} else {
			console.error(current_path + ' is not a file or directory.');
		}
	}).catch(err => {
		console.error(err);
	});
}

function ProcessArgs() {
	//We use a set because it allows for only unique items.
	var args = new Set(process.argv.slice(2));
	
	//If the help command was given at all, we just do help and quit.
	if(args.has('--help')) {
		PrintHelp();
	}

	//Set variable for dry run.
	if(args.has('-R')) {
		recursive = true;
		args.delete('-R')
	}

	args.forEach(current_arg => {
		ProcessPathArgs(path.resolve(current_arg),true);
	});
}

ProcessArgs();
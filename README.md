# syncrename
Rename .sync-conflict-20* files that Syncthing sometimes litters to the original and proper filenames. Also checks if they are different files, if the file path already exists. stderr will contain information about files not renamed.

## Usage
```syncrename.js [files/dirs] -R```

-R flag tells it to be recursive.

--help flag will print help.

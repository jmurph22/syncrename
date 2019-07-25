install:
	install -m 755 syncrename.js /usr/bin
	npm install -g fs-extra
uninstall:
	rm /usr/bin/syncrename.js

ROOT  = ../..
RSYNC = rsync -r --exclude=.svn
TTREE = bin/build-ttree

all:  install-apache install-lib install-jause install-images install-dist-example install-misc install-smokers

install-smokers:
	$(RSYNC) smokers/JSAN-Smoke/lib $(ROOT)/smokers
	$(RSYNC) smokers/JSAN-Smoke/root $(ROOT)/smokers
	$(RSYNC) smokers/JSAN-Smoke/smoke.html $(ROOT)/smokers

install-lib:
	$(RSYNC) lib $(ROOT)

install-jause:
	WHERE="$(ROOT)/htdocs" $(TTREE) jause/index.html 
	find $(ROOT)/htdocs -type d -name .svn | xargs rm -rf

install-apache:
	$(RSYNC) etc $(ROOT)

install-images:
	$(RSYNC) images $(ROOT)/htdocs

install-dist-example:
	cd eg/JSAN.Example && perl Build.PL && ./Build dist && cp *.tar.gz ../../$(ROOT)/htdocs/documentation/ && rm *.tar.gz && ./Build distclean

install-misc:
	cp misc/favicon.ico $(ROOT)/htdocs
	cp misc/master_logo.png $(ROOT)/misc
	cp misc/JSAN-*.tar.gz $(ROOT)/htdocs/documentation
	cp misc/mirror.yml $(ROOT)/htdocs

remove-lib:
	rm -rf $(ROOT)/lib

remove-jause:
	rm -rf $(ROOT)/htdocs/jause

remove-apache:
	rm -rf $(ROOT)/etc


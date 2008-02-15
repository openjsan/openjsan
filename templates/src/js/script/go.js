 JSAN.use('HTTP.Request');
 JSAN.use('HTTP.Query');
 JSAN.use('YAML');

 var http  = new HTTP.Request;
 var yaml  = http.getText('/index.yaml');
 var index = new YAML().load(yaml);
 var query = new HTTP.Query(location.search);

 if (query.get('q')) {
     var search = query.get('q');
     var type   = query.get('t');
     
     query.set(type, search);
 }
 
 if (query.get('a')) {
     var author = query.get('a');
     if (index.authors[author])
         location.href = index.authors[author].doc;
     query.set('q', author);
 } else if (query.get('l')) {
     var lib = query.get('l');
     if (index.libraries[lib])
         location.href = index.libraries[lib].doc;
     query.set('q', lib);
 } else if (query.get('d')) {
     var dist      = query.get('d');
     if (index.distributions[dist])
         location.href = index.distributions[dist].doc;
     query.set('q', dist);
 } else if (query.get('r')) {
     var dv   = query.get('r').split('-');
     var dist = index.distributions[dv[0]];
     if (dist) {
         var releases = dist.releases;
         for (var i = 0; i < releases.length; i++) {
             var version = releases[i].version;
             if (version == dv[1]) {
                 location.href = releases[i].doc;
             }
         }
     }
     query.set('q', query.get('r'));
 }

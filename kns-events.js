var events = require("events"),
	sys = require('util'),
	async = require('async'),
  http = require('./lib/httpclient');

module.exports = KNS;

function KNS(appid, _opts){
	opts = _opts || {};
	this._appid = appid;
	this._eventdomain = opts["eventdomain"] || "node";
	this._appversion = opts["appversion"] || "production";
  this.client = new http.httpclient();
	events.EventEmitter.call(this);
}

KNS.super_ = events.EventEmitter;
KNS.prototype = Object.create(events.EventEmitter.prototype, {
	constructor: {
		value: KNS,
		enumerable: false
	}
});

KNS.prototype.signal = function(eventname, context) {
  context = context || {};
	var self = this;
	var url = 'http://cs.kobj.net/blue/event/'+this._eventdomain+'/'+eventname+'/'+this._appid+'/';

	//version handling
	if(self._appversion != "production"){
		context[''+this._appid+':kinetic_app_version'] = self._appversion;
	}

  if(opts.logging){
    console.log("Signaling event to: ",url," with params: ");
    console.log(context);
  }

  this.client.perform(url, "POST", function(response,error) {
    //parse json response
    //emit a rawresponse event that can be used to display full kns response
    //sys.puts(data);
    if(response === -1){
      self.emit('error',error);
      return;
    }
    var data = response.response.body;
    var regex_sc1 = /(^[\/]{2}[^\n]*)|([\n]{1,}[\/]{2}[^\n]*)/g;
    if(opts.logging){
      logging = data.replace(regex_sc1, "$1$2");
      console.log(logging);
    }
    nocomments = data.replace(regex_sc1, "");
    ddoc = JSON.parse(nocomments);

    async.forEachSeries(ddoc['directives'], function(d,cb){
      if(opts.logging){
        console.log("Calling",d['name'], " with ", JSON.stringify(d['options']));
      }
      self.emit(d['name'], d['options']);
      cb();
    }, function(err){
      //all methods are done.
    });
  }, context);
};

KNS.prototype.appid = function(newappid) {
	if(newappid){
		this._appid = newappid;
	}
	return this._appid;
};

KNS.prototype.appversion = function(newversion) {
	if(newversion){
		this._appversion = newversion;
	}
	return this._appversion;
};

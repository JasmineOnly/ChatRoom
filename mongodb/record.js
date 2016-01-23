var Record = function(from, to, msg) {
  this.from = from;
  this.to = to;
  this.msg = msg;
}

Record.prototype.store = function(db, callback) {
	var collection = db.collection('records');
	collection.insert(
		{
			from: this.from,
			to: this.to,
			msg : this.msg
		},
		function(err, result) {
			if(err) {
				console.log('Error:' + err);
			}
			else 
			{
				//callback.call(this, result);
				callback(result);
			}
		}
	);
}


Record.findAll = function(db, callback) {
	var collection = db.collection('records');
	collection.find().toArray(function(err, result){
		if(err) {
			console.log('error:' + err);
		}
		else {
			callback(result);
		}
	});
}

exports.Record = Record;
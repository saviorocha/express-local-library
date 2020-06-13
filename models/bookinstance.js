let mongoose = require('mongoose');
let moment = require('moment');
let Schema = mongoose.Schema;

let BookInstanceSchema = new Schema(
    {
        book: {type: Schema.Types.ObjectId, ref: 'Book', required: true},
        imprint: {type: String, required: true},
        status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance'},
        due_back: {type: Date, default: Date.now}        
    }
);

BookInstanceSchema
    .virtual('due_back_formatted')
    .get(function() {
        return this.due_back ? moment(this.due_back).format('YYYY-MM-DD') : '';
    });

BookInstanceSchema
    .virtual('url')
    .get(function() {
        return '/catalog/bookinstance/' + this._id;
    });

module.exports = mongoose.model('BookInstance', BookInstanceSchema);

let mongoose = require('mongoose');
let moment = require('moment');
let Schema = mongoose.Schema;

let AuthorSchema = new Schema(
    {
        first_name: { type: String, required: true, max: 100 },
        family_name: { type: String, required: true, max: 100 },
        date_of_birth: { type: Date },
        date_of_death: { type: Date }
    }
);

//Virtual para o nome completo do autor
AuthorSchema
    .virtual('name')
    .get(function () {
        let fullName = '';
        if (this.first_name && this.family_name) {
            fullName = this.family_name + ' ' + this.first_name;
        }
        if (!this.first_name || !this.family_name) {
            fullName = '';
        }
        return fullName;
    });

AuthorSchema
    .virtual('lifespan')
    .get(function () {
        let lifetime_string = '';
        if (this.date_of_birth) {
            lifetime_string = moment(this.date_of_birth).format('MMMM Do, YYYY');
        }
        lifetime_string += ' - ';
        if (this.date_of_death) {
            lifetime_string += moment(this.date_of_death).format('MMMM Do, YYYY');
        }
        return lifetime_string;
    });

AuthorSchema
    .virtual('date_of_birth_formatted')
    .get(function () {
        return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
    });

AuthorSchema
    .virtual('date_of_death_formatted')
    .get(function () {
        return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
    });

AuthorSchema
    .virtual('url')
    .get(function () {
        return '/catalog/author/' + this._id;
    });

module.exports = mongoose.model('Author', AuthorSchema);

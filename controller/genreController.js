let Genre = require('../models/genre');
let Book = require('../models/book');
let async = require('async');

const validator = require('express-validator');
// var mongoose = require('mongoose');

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
    Genre.find()
        .populate('genre')
        .sort([['name', 'ascending']])
        .exec(function (err, list_genre) {
            if (err) { return next(err); }
            res.render('genre_list', { title: 'Genre list', genre_list: list_genre });
        });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
    // var id = mongoose.Types.ObjectId(req.params.id);  
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function (callback) {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        }
    }, function (err, results) { // callback opcional; results recebe o objeto com o retorno das funcoes passadas no async {retorno da 1 funcao, retorno da 2 funcao ...}
        if (err) { return next(err); }
        if (results.genre == null) { // nenhum resultado
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err); // propaga o erro até o error handler do app.js
        }
        // ambos requests tiveram sucesso, renderiza a pagina
        res.render('genre_detail',
            {
                title: 'Genre Detail',
                genre: results.genre,
                genre_books: results.genre_books

            });
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
/**
 *  The first thing to note is that instead of being a single middleware function 
 *  (with arguments (req, res, next)) the controller specifies an array of middleware functions. 
 *  The array is passed to the router function and each method is called in order.
    This approach is needed, because the sanitisers/validators are middleware functions.
 */
exports.genre_create_post = [
    // Valida se o nome nao esta vazio
    validator.body('name', 'Genre name required').trim().isLength({ min: 1 }),
    // Sanitize (escape) the name field.
    validator.sanitizeBody('name').escape(),

    // Processe o request depois da validacao e higienizacao
    (req, res, next) => {
        const errors = validator.validationResult(req);

        // Create a genre object with escaped and trimmed data.        
        let genre = new Genre(
            { name: req.body.name }
        );

        // Se tiverem erros, renderize o form novamente com valores corrigidos e mensagens de erros
        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        } else {
            // Os dados do form sao validos, cheque se o genero ja existe
            Genre.findOne({ 'name': req.body.name })
                .exec(function (err, found_genre) {
                    if (err) { return next(err); }
                    if (found_genre) {
                        // Genero existe, redirecione para genre_detail
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function (err) {
                            if (err) { return next(err); }
                            // Genero salvo redirecione para genre_detail
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function (callback) {
            Book.find({ genre: req.params.id }).exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.genre == null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function (callback) {
            Book.find({ 'genre': req.params.id }).exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.genre_books == null) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
        } else {
            Genre.findByIdAndDelete(req.body.genreid, function (err) {
                if (err) { return next(err); }
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
    Genre.findById(req.params.id)
        .exec(function (err, genre) {
            if (err) { return next(err); }
            if (genre == null) {
                let err = new Error('Genre not found');
                err.status = 404;
                return next(err);
            }
            res.render('genre_form', { title: 'Update Genre', genre: genre })
        });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    validator.body('name', 'Genre required').trim().isLength({ min: 1 }),
    validator.sanitizeBody('name').escape(),

    (req, res, next) => {

        const errors = validator.validationResult(req);

        let genre = new Genre(
            { 
                _id: req.params.id,
                name: req.body.name 
            }
        );

        if (!errors.isEmpty()) {
            res.render('genre_form', { title: 'Update Genre', genre: req.body, errors: errors.array() });
            console.log('errors');
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
                if (err) { return next(err); }
                res.redirect(thegenre.url);
            });
        }

    }

];

let BookInstance = require('../models/bookinstance');
let Book = require('../models/book');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
let async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) { return next(err) }
            res.render('bookinstance_list', { title: 'Book instance list', bookinstance_list: list_bookinstances })
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            if (bookinstance == null) {
                let err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res) {
    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) { return next(err); }
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        let bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {

            // There are errors. Render form again with sanitized values and error messages.
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance })
                });
            return;
        } else {
            bookInstance.save(function (err) {
                if (err) { return next(err); }
                res.redirect(bookInstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            if (bookinstance == null) {
                res.redirect('/catalog/bookinstances');
            }
            res.render('bookinstance_delete', { title: 'Delete Book Instance', book_instance: bookinstance });
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findByIdAndDelete(req.body.bookinstanceid, function (err) {
        if (err) { return next(err); }
        console.log(req.body);
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
    async.parallel({
        book_list: function (callback) {
            Book.find({}, '').exec(callback);
        },
        bookinstance: function (callback) {
            BookInstance.findById(req.params.id).exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.bookinstance == null) {
            let err = new Error('There are no book instances');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: results.bookinstance, book_list: results.book_list });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {

        const errors = validationResult(req);

        let bookinstance = new BookInstance({
            _id: req.params.id,
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            async.parallel({
                book_list: function (callback) {
                    Book.find({}, 'title').exec(callback);
                },
                bookinstance: function (callback) {
                    BookInstance.findById(req.params.id).exec(callback);
                }
            }, function (err, results) {
                if (err) { return next(err); }
                console.log('list: ');
                console.log(results.book_list);
                res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: results.bookinstance, book_list: results.book_list });
            });
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, theinstance) {
                if (err) { return next(err); }
                res.redirect(theinstance.url);
            });
        }
    }
];
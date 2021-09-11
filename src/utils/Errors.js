module.exports.ERRORS = {
    DEFAULT:{
        CODE:401,
        MSG: 'unexpected error'
    },
    DB_CONNECTION:{
        CODE: 100,
        MSG: 'The server couldn\'t connect to the database correctly.'
    },
    DB_FIND_DEFINITE:{
        CODE: 101,
        MSG: 'The database should\'ve find a record. Found nothing instead.'
    },
    DB_UPDATE:{
        CODE: 106,
        MSG: 'The database couldn\'t update some records.'
    },
    TOKEN_VALIDATION:{
        CODE: 121,
        MSG: 'The token couldn\'t be verifed correctly.'
    },
    INVALID_FORGE:{
        CODE: 180,
        MSG: 'Unexpected forge found.'
    },
    INVALID_EXTRACT:{
        CODE: 181,
        MSG: 'Unexpected extract found.'
    },
}
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
    INVALID_EQUIP:{
        CODE: 182,
        MSG: 'Unexpected Equip found.'
    },
    INVALID_JOIN_BATTLE:{
        CODE: 183,
        MSG: 'Unexpected Join Battle found.'
    },
    INVALID_LEFT_BATTLE:{
        CODE: 184,
        MSG: 'Unexpected Left Battle found.'
    },
    INVALID_REFER:{
        CODE: 185,
        MSG: 'Invalid nickname for refer.'
    },
    INVALID_NICKNAME:{
        CODE: 185,
        MSG: 'The nikcname are alredy in use.'
    },
    ERROR_NICKNAME:{
        CODE: 185,
        MSG: 'Can change nickname only one time.'
    },
    AUTH_URL:{
        CODE: 160,
        MSG: 'Error generating URL for authentification.'
    },
    AUTH_VALIDATE:{
        CODE: 161,
        MSG: 'Unexpected Error validating auth'
    },
    AUTH_CHECKOUT:{
        CODE: 162,
        MSG: 'Unexpected Error CHECKOUT auth'
    },
    ERROR_ATH_CHECKOUT:{
        CODE: 162,
        MSG: 'Unexpected Error CHECKOUT auth'
    },
}
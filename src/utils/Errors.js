class WandlordError extends Error{

    constructor(){
        super();
        this.code = 401;
        this.message = 'unexpected error';
    }

    DB_CONNECTION(){
        this.code = 100,
        this.message = 'The server couldn\'t connect to the database correctly.'
    }

    DB_FIND_DEFINITE(){
        this.code = 101,
        this.message = 'The database should\'ve find a record. Found nothing instead.'
    }
    DB_CREATE_ID(){
        this.code = 102,
        this.message = 'Error creating Mongodb Id.'
    }

    DB_UPDATE_DEFINITE(){
        this.code = 107,
        this.message = 'The database should\'ve update a record. Update nothing instead.'
    }

    DB_UPDATE(){
        this.code = 106,
        this.message = 'The database couldn\'t update some records.'
    }

    DB_INSERT(){
        this.code = 108,
        this.message = 'The database couldn\'t insert some records.'
    }

    TOKEN_VALIDATION(){
        this.code = 121,
        this.message = 'The token couldn\'t be verifed correctly.'
    }

    INVALID_FORGE(){
        this.message = 'Unexpected forge found.'
    }

    INVALID_EXTRACT(){
        this.code = 181,
        this.message = 'Unexpected extract found.'
    }

    INVALID_EQUIP(){
        this.code = 182,
        this.message = 'Unexpected Equip found.'
    }

    INVALID_JOIN_BATTLE(){
        this.code = 183,
        this.message = 'Unexpected Join Battle found.'
    }

    INVALID_LEFT_BATTLE(){
        this.code = 184,
        this.message = 'Unexpected Left Battle found.'
    }

    INVALID_REFER(){
        this.code = 185,
        this.message = 'Invalid nickname for refer.'
    }

    INVALID_NICKNAME(){
        this.code = 185,
        this.message = 'The nikcname are alredy in use.'
    }

    ERROR_NICKNAME(){
        this.code = 185,
        this.message = 'Can change nickname only one time.'
    }

    AUTH_URL(){
        this.code = 160,
        this.message = 'Error generating URL for authentification.'
    }

    AUTH_VALIDATE(){
        this.code = 161,
        this.message = 'Unexpected Error validating auth'
    }

    AUTH_CHECKOUT(){
        this.code = 162,
        this.message = 'Unexpected Error CHECKOUT auth'
    }

    ERROR_ATH_CHECKOUT(){
        this.code = 162,
        this.message = 'Unexpected Error CHECKOUT auth'
    }
    ERROR_REGISTER(){
        this.code = 0,
        this.message = 'Unexpected Error on REGISTER'
    }
}
module.exports = new WandlordError();
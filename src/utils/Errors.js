class WandlordError extends Error{

    constructor(){
        super();
        this.code = 401;
        this.message = 'unexpected error';
    }

    DB_CONNECTION(){
        this.code = 100,
        this.message = 'The server couldn\'t connect to the database correctly.'
        return this;
    }

    DB_FIND_DEFINITE(){
        this.code = 101,
        this.message = 'The database should\'ve find a record. Found nothing instead.'
        return this;

    }
    DB_CREATE_ID(){
        this.code = 102,
        this.message = 'Error creating Mongodb Id.'
        return this;

    }

    DB_UPDATE_DEFINITE(){
        this.code = 107,
        this.message = 'The database should\'ve update a record. Update nothing instead.'
        return this;

    }

    DB_UPDATE(){
        this.code = 106,
        this.message = 'The database couldn\'t update some records.'
        return this;

    }

    DB_INSERT(){
        this.code = 108,
        this.message = 'The database couldn\'t insert some records.'
        return this;

    }

    TOKEN_VALIDATION(){
        this.code = 121,
        this.message = 'The token couldn\'t be verifed correctly.'
        return this;

    }

    INVALID_FORGE(){
        this.code = 180,
        this.message = 'Unexpected forge found.'
    }

    INVALID_EXTRACT(){
        this.code = 181,
        this.message = 'Unexpected extract found.'
        return this;

    }

    INVALID_EQUIP(){
        this.code = 182,
        this.message = 'Unexpected Equip found.'
        return this;
    }

    INVALID_JOIN_BATTLE(){
        this.code = 183,
        this.message = 'Unexpected Join Battle found.'
        return this;
    }

    INVALID_LEFT_BATTLE(){
        this.code = 184,
        this.message = 'Unexpected Left Battle found.'
        return this;
    }

    INVALID_REFER(){
        this.code = 185,
        this.message = 'Invalid nickname for refer.'
        return this;
    }

    INVALID_NICKNAME(){
        this.code = 185,
        this.message = 'The nikcname are alredy in use.'
        return this;
    }

    ERROR_NICKNAME(){
        this.code = 185,
        this.message = 'Can change nickname only one time.'
        return this;
    }

    AUTH_URL(){
        this.code = 160,
        this.message = 'Error generating URL for authentification.'
        return this;
    }

    AUTH_VALIDATE(){
        this.code = 161,
        this.message = 'Unexpected Error validating auth'
        return this;
    }

    AUTH_CHECKOUT(){
        this.code = 162,
        this.message = 'Unexpected Error CHECKOUT auth'
        return this;
    }

    ERROR_ATH_CHECKOUT(){
        this.code = 162,
        this.message = 'Unexpected Error CHECKOUT auth'
        return this;
    }
    ERROR_REGISTER(){
        this.code = 0,
        this.message = 'Unexpected Error on REGISTER'
        return this;
    }
    INVALID_LOGIN(){
        this.code = 300,
        this.message = 'Unexpected request when user can\'t do.'
        return this;
    }
    ERROR_IsFigthing(){
        this.code = 300,
        this.message = 'Unexpected request when user can\'t do.'
        return this;
    }
}
module.exports = new WandlordError();
class Err extends Error{
    constructor(name, code){
        super();
        this.name = name;
        this.code = code;
    }
    test(){
        this.name = "Error1";
        this.code = 112;
        return this;
    }
}
const e = new Err();
function test(){
    try{
        throw new e.test();
    }catch(err){
        console.log({name:"asdasd", payload: e.test()});
        console.log(err.code, err.name);
        console.log(err instanceof Err);
    }
}

test();
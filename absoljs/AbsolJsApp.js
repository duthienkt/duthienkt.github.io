import Application from 'absol/src/AppPattern/Application';
import Acomp from 'absol-acomp/AComp';
import DocumentAct from './document/DocumentAct';


var _ = Acomp._;
var $ = Acomp.$;

function AbsolJsApp() {
    Application.call(this);
}


Object.defineProperties(AbsolJsApp.prototype, Object.getOwnPropertyDescriptors(Application.prototype));
AbsolJsApp.prototype.constructor = AbsolJsApp;

AbsolJsApp.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _('.as-app');
    return this.$view;
};


AbsolJsApp.prototype.setContentView = function (view, overlay) {
    this.$view.clearChild()
        .addChild(view);

};

AbsolJsApp.prototype.onStart = function () {
    this.startActivity(new DocumentAct());
}

AbsolJsApp.newInstance = function () {
    console.log(AbsolJsApp.prototype);
    var instance = new AbsolJsApp();
    instance.getView().addTo(document.body);
    instance.start();
    return instance;
};

export default AbsolJsApp;
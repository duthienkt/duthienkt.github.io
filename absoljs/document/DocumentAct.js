import Activity from 'absol/src/AppPattern/Activity';
import AComp from 'absol-acomp';
import showdown from 'showdown';
import XHR from 'absol/src/Network/XHR';
import './style.css';


var _ = AComp._;
var $ = AComp.$;

function DocumentAct() {
    Activity.call(this);
    this.mdCvt = new showdown.Converter();
}


Object.defineProperties(DocumentAct.prototype, Object.getOwnPropertyDescriptors(Activity.prototype));
DocumentAct.prototype.constructor = DocumentAct;


DocumentAct.prototype.getView = function () {
    if (this.$view) return this.$view;
    this.$view = _({
        class: ['as-act', 'as-act-help'],
        child: [
            {
                class: 'as-bar-top',
                child: [
                    {
                        tag: 'button',
                        class: 'back-btn',
                        child: 'span.mdi.mdi-arrow-left-bold',
                        on: {
                            click: this.finish.bind(this)
                        }
                    },
                    {
                        tag: 'span',
                        class: 'title-text',
                        child: { text: "DOCUMENTATION" }
                    }
                ]
            },
            {
                class: 'as-bar-left'
            },
            {
                class: 'as-explore-container',
                child: {
                    tag: 'bscroller'
                }
            },
            {
                tag: 'bscroller',
                class: ['dark', 'as-document-container'],
                child: '.as-document'
            }
            // {
            //     class: 'document-exp-container'
            // }
        ]
    });

    this.$document = $('.as-document', this.$view);
    this.$explore = $('.as-explore-container > bscroller', this.$view);
    return this.$view;
};

DocumentAct.prototype.onStart = function () {
    this.loadTree();
};

DocumentAct.prototype.loadTree = function () {
    XHR.getRequest('./document/modules.json', 'json').then(function (res) {
        this.viewTree(res);
    }.bind(this));
};



DocumentAct.prototype.viewTree = function (data) {
    this.$explore.clearChild();
    var self = this;

    function visit(node) {
        var res = _({
            tag: 'exptree',
            props: {
                name: node.name,
                docSrc: node.src
            },
            child: (node.content || []).map(function (e) {
                return visit(e);
            })
        });
        if (node.type == "FOLDER") {
            res.extSrc = 'https://volcanion.cf/exticons/extra/folder.svg';
            res.status = 'close';
            res.on('press', function () {
                if (this.status == 'open') {
                    this.status = 'close';
                }
                else {
                    this.status = 'open';
                }
            });
        }
        res.on('press', function () {
            if (this.docSrc) {
                self.viewDocBySrc(this.docSrc);
            }
        })
        return res;
    }
    this.$explore.addChild(visit(data));
};

DocumentAct.prototype.viewDocBySrc = function (src) {
    var self = this;
    XHR.getRequest(src, 'text').then(function (res) {
        var html = self.mdCvt.makeHtml(res);
        self.$document.innerHTML = html;
        $('pre > code', self.$document, function (elt) {
            console.log(elt);

            elt.classList.add('absol-bscroller');
            hljs.highlightBlock(elt);
        });
        window.dispatchEvent(new Event('resize'));
    }.bind(this));
};

export default DocumentAct;
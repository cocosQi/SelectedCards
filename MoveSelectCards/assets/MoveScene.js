// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
//扩展代理
cc.Node.prototype._delegate = {
    touchstart:null,
    touchmove:null,
    touchend:null,
    touchcancel:null,
    selected:null,
    unSelected:null,
}
//设置代理
cc.Node.prototype.setDelegate = function (delegate){
    this._delegate = delegate;
}
//添加移动多选功能
cc.Node.prototype.addMoveMultipleChoice = function (offset) {

    var self = this;

    self.xOffset = offset;
    self.isMove = false;

    self.on('touchstart', function (event) {

        if (self.isMove) return console.log('正在多选移动中... 无法重复多选 发生bug');

        self.tempSelectedNodes = [];

        var startLocationX = event.getLocation().x;

        self.on('touchmove', function (event) {

            var moveLocationX = event.getLocation().x;
            self.calculateLocation(startLocationX, moveLocationX, self);

            self.isMove = true;

        });

        self.on('touchend', function (event) {

            self.isMove = false;
            if (self._delegate && self._delegate.touchend) {
                self._delegate.touchend(self.getAllSelected());
            }
            self.offOn(self);
            self.removeAllFlag(self.children);

        });

        self.on('touchcancel', function (event) {
            self.isMove = false;
            self.offOn(self);
            self.removeAllFlag(self.children);
        });

    });


}
//计算位置 在拖动范围内则返回选中节点 已经所有选中节点
cc.Node.prototype.calculateLocation = function(startLocation,moveLocation, node){

    if (!node) return;

    var children = node.children;

    var x3 = startLocation;
    var x4 = moveLocation;

    // 区间位置互换，始终保持x3 < x4
    if (x3 > x4) {
        var temp = x3;
        x3 = x4;
        x4 = temp;
    }

    for (var index = 0; index < children.length; index ++){

        var childrenNode = children[index];

        var x1 = childrenNode.x;

        var x2 = childrenNode.x + childrenNode.width - this.xOffset;

        // 最后一张牌显示面积要大一些
        if (index == children.length - 1) x2 += this.xOffset;

        // x1 x2 单张扑克计算范围
        // x3 x4 开始位置 移动消息触发位置
        // ---x3-------x1--------x2-------x4--- 形势1 中间
        // ---x1-------x3--------x2-------x4--- 形势2 前部
        // ---x3-------x1--------x4-------x2--- 形势3 尾部

        var isSelected = false;
        if (x1 >= x3 && x2 <= x4){
            isSelected = true;
        }else if (x1 <= x3 && x2 <= x4 && x2 >= x3){
            isSelected = true;
        }else if (x1 >= x3 && x1 <= x4 && x2 >= x4){
            isSelected = true;
        }

        if (isSelected){
            if (this._delegate && this._delegate.selected && !this.isSelectedNode(childrenNode)) {
                this.addFlag(childrenNode);
                this.tempSelectedNodes.push(childrenNode);
                this._delegate.selected(childrenNode);
            }
        }else {
            if (this._delegate && this._delegate.selected) {
                this.removeFlag(childrenNode);
                this.findAndRemoveTempNode(childrenNode);
                this._delegate.unSelected(childrenNode);
            }
        }


    }

}

cc.Node.prototype.isSelectedNode = function (node){
    return node.hasOwnProperty('flag');
}
//添加选中标志 如果已添加标志 则不需要重复回调代理
cc.Node.prototype.addFlag = function (node){
    node && (node.flag = 1);
}
cc.Node.prototype.removeFlag = function(node){
    node && (delete node.flag);
}
cc.Node.prototype.removeAllFlag = function (nodes){
    for (var index = 0; index < nodes.length; index ++) {
        this.removeFlag(nodes[index]);
    }
}
cc.Node.prototype.getAllSelected = function (){
    return this.tempSelectedNodes || [];
}
cc.Node.prototype.findAndRemoveTempNode = function (node){

    var temp = [];

    for (var index = 0; index < this.tempSelectedNodes.length; index ++) {

        if (node == this.tempSelectedNodes[index]) {
            continue;
        }
        temp.push(this.tempSelectedNodes[index]);
    }
    this.tempSelectedNodes = temp;
}

cc.Node.prototype.offOn = function (node){
    node &&  node.off('touchmove');
    node &&  node.off('touchend');
    node &&  node.off('touchcancel');
}

cc.Class({
    extends: cc.Component,

    properties: {

        cardsNode:cc.Node

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {


        this.cardsNode.addMoveMultipleChoice(50);
        this.cardsNode.setDelegate({
            selected: function (node) {
                node.y = 20;
            },
            touchend: function (allNodes) {
                console.log(allNodes);
            },
            unSelected: function (node) {
                node.y = 0;
            }
        })


    },

    start () {

    },

    // update (dt) {},
});

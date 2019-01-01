//可以将元素分为三类Element，Text，和自定义组件
var ELEMENT = 'element', TEXT = 'text', COMPONENT = 'component';

//Babel将JSX里的标记元素转换为createElement函数
//这里要实现这个函数，返回{type, nodeType, props}的结构,以便渲染时使用
function createElement(type, props, args){
    var isElement = typeof type == 'string', props = Object.assign({}, props), hasChildren = arguments.length > 2;
    var children = hasChildren ? [].concat(arguments.slice(2)) : [];

    props.children = children.map(function(child) {
        return (typeof child == 'string' ? { nodeType: TEXT, nodeValue: child } : child)
    })

    return {type: type, nodeType: isElement ? ELEMENT : COMPONENT, props: props }
}


//更新时需要对比上一次渲染时的数据，我们需要创建一个实例树instanceTree来保存这些相关数据。
//为此我们需要保留原始节点的所有相关属性,同时我们在对比时需要对节点进行操作，所以我们也要保存当前的DOM元素，当然我们也要保存子元素的实例树
var instanceTree = null;

function render(element, container){
    instanceTree = createInstance(element)
    container.appendChild(instanceTree.dom);
}

//创建实例
function createInstance(element) {
    var instance, dom, props = element.props, hasChildren = props.children.length, children = hasChildren ? props.children : [];
    var isElement = element.nodeType == ELEMENT, isText = element.nodeType == TEXT, isComponent = element.nodeType == COMPONENT;

    if(isElement){
        dom = document.createElement(element.type);

        //属性相关操作省略

        var childInstances = children.map(function(child){
            var childInstance = createInstance(child);
            dom.appendChild(childInstance.dom);
            return childInstance;
        })

        instance = Object.assign({}, { dom: dom, element: element, childInstances: childInstances });

    }else if(isComponent){
        var component = new element.type(), componentElement = component.render();

        instance = createInstance(componentElement)

        //对于自定义组件，当组件的某些状态值发生变化时，我们只需要重新渲染组件内的内容，因此组件需要获取之前渲染的实例对象才能跟新状态进行对比
        component.__instance = instance;

        /**
         * const A1 = () => (<div className="a"></div>);
         * const A2 = () => (<div className="a">{ this.props.children }</div>);
         * const B = () => (<div className="b"></div>);
         * const APP1 = () => (<A1><B /></A1>);相当于createElement(A1, null, B);
         * const APP2 = () => (<A2><B /></A2>);相当于createElment(A2, null, B);
         * 实际上只有APP2是正确的，对于类似组件的嵌套，我们会在这段程序中发现虽然存在children = B，
         * 但是这种情况下我们会忽略对children的处理，只有当父组件内部真实引用时(如：{this.props.children})才会被渲染
         **/
        return instance;
    }else if(isText){
        dom = document.createTextNode(element.nodeValue);

        instance = { dom: dom, element: element, childInstances: null };
    }

    return instance;
}

//剩下的就是对比了，通常对于react，当我们setState或者更新props时就会触发更新diff渲染操作
//下面是一段关于伪代码

var setState = function(newState){
    this.state = Object.assign({}, this.state, newState);

    var newElement = this.render(), instance = this.__instance, parentDom = this.__instance.dom.parentNode;
    var newInstance = diff(parentDom, instance, newElement)

    this.__instance = newInstance;
}

/**
 * 关于对比，最简单的办法就是对比节点的tabName也就是type值
 * 1. 如果type值一样，那么只用更新属性(属性, className, 事件等，当然需要先删除原来的属性事件和className)
 * 2. 如果type值不一样，则替换新的dom元素，帮设置相关属性
 * 3. 如果没有新的element，则表示这个元素已经被删除
 * 4. 同样如果原实例树不存在的节点，在最新的elmement中存在，则表示新增节点
 * 总结下来就是，父元素对子元素的: set(remove)Attribute, add(remove)EventListener, appendChild, removeChild, replaceChild操作
 **/
function diff(parentDom, prevInstance, element) {
    if(!prevInstance){
        var newInstance = createInstance(element);
        parentDom.appendChild(newInstance.dom);

        return newInstance;
    }else if(!element){
        parentDom.removeChild(prevInstance.dom);
        return null;
    }else if(prevInstance.dom.type == element.type){
        //更新属性操作

        //只有type值一样，我们才需要继续处理其子元素
        var max = Math.max(prevInstance.childInstances.length, element.props.children.length), newChildInstances = [];
        for(var i = 0; i < max; i++){
            var childInstance = prevInstance.childInstances[i];
    		var childElement = element.props[i];

    		var newChildInstance = diff(prevInstance.dom, childInstance, childElement);
    		newChildInstances.push(newChildInstance);
        }

        prevInstance.childInstances = newChildInstances;
        prevInstance.element = element;

        return prevInstance;
    }
    var prevElement = prevInstance.element, prevDom = prevInstance.dom;
}

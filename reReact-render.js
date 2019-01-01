//可以将元素分为三类Element，Text，和自定义组件
var ELEMENT = 'element', TEXT = 'text', COMPONENT = 'component';

//Babel将JSX里的标记元素转换为createElement函数
//这里要实现这个函数，返回{nodeType, props}的结构,以便渲染时使用
function createElement(type, props, args){
    var isElement = typeof type == 'string',props = Object.assign({}, props), hasChildren = arguments.length > 2;
    var children = hasChildren ? [].concat(arguments.slice(2)) : [];

    props.children = children.map(function(child) {
        return (typeof child == 'string' ? { nodeType: TEXT, nodeValue: child } : child)
    })

    return { type: type, nodeType: isElement ? ELEMENT : COMPONENT, props: props }
}

function render(elements, container){
    var dom = createDom(elements);
    container.appendChild(dom);
}

//最终转化并传经dom节点树
function createDom(element) {
    var dom, props = element.props, hasChildren = props.children.length, children = hasChildren ? props.children : [];
    if(element.nodeType == ELEMENT){
        dom = document.createElement(element.type);
    }else if(element.nodeType == TEXT){
        dom = document.createTextNode(element.nodeValue);
    }else if(element.nodeType == COMPONENT){
        var component = new element.type();
        dom = component.render();
    }

    //属性操作省略

    children.map(function(child){
        var childDom = createDom(child);
        dom.appendChild(childDom);
    })

}

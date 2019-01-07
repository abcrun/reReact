//可以将元素分为三类Element，Text，和自定义组件
var ELEMENT = 'element', TEXT = 'text', COMPONENT = 'component';
var PLACEMENT = 'placement', UPDATE = 'update', DELETION = 'deletion';

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


var renderQueue = [], currentFiber = null, timeUnit = 1, pendingCommit = false;

function render(element, container){
    renderQueue.push({
        dom: container,
        element: element
    })

    requestIdleCallback(performWork)
}

function setState(newState){
    this.state = Object.assign({}, this.state, newState);

    var newElement = this.render(this.props);

    renderQueue.push({
        instance: this,
        element: newElement
    })

    requestIdleCallback(performWork);
}

function performWork(idleDeadline){
    currentFiber = currentFiber || renderQueue.shift();

    while(idleDeadline.timeRemaining() > timeUnit && currentFiber){
        currentFiber = performUnitOfWork(currentFiber);
    }

    if(pendingCommit) commitAllWork();

    if(currentFiber || renderQueue.length > 0){
        requestIdleCallback(performWork);
    }
}

function performUnitOfWork(currentFiber){
    var element = currentFiber.element;

    //如果存在instance属性，说明这是一个自定义组件且通过setState传递过来的
    if(currentFiber.instance){
        currentFiber = source.instance.__fiber;

        diffFiber(currentFiber.parent, element)
    }else if(currentFiber.dom){
        currentFiber = createFiber(element, null);

        diffFiber(currentFiber, element.props.children)
    }


    if(currentFiber.child){
        return currentFiber.child;
    }
}

//创建实例
function createFiber(element, parentFiber) {
    var dom, props = element.props, hasChildren = props.children.length, children = hasChildren ? props.children : [];
    var isElement = element.nodeType == ELEMENT, isText = element.nodeType == TEXT, isComponent = element.nodeType == COMPONENT;

    if(isElement){
        dom = document.createElement(element.type);

        fiber.stateNode = dom;
        fiber.type = element.type;
        fiber.effectTag = PLACEMENT;
        fiber.props = props;
        fiber.parent = parentFiber || null;


    }else if(isComponent){
        var component = new element.type(props), componentElement = component.render();

        fiber = createFiber(componentElement, parentFiber)

        //对于自定义组件，当组件的某些状态值发生变化时，我们只需要重新渲染组件内的内容，因此组件需要获取之前渲染的实例对象才能跟新状态进行对比
        component.__fiber = fiber;

    }else if(isText){
        dom = document.createTextNode(element.nodeValue);

        fiber = { statNode: dom, props: element.props, effectTag: PLACEMENT };
    }

    return fiber;
}



function diffFiber(fiber, element) {
    var newFiber = {};

    if(fiber.type == element.type){
        fiber.effectTag = UPDATE;
        fiber.props = element.props;

        //只有type值一样，我们才需要继续处理其子元素
        var index = 0, oldFiber = fiber.child, prevFiber = newFiber = null, children = element.props.children;
        while(index < children.length || oldFiber != null){
            var elm = index < children.length && children[index],
                sameType = oldFiber && elm && elm.type == oldFiber.type;

            if(oldFiber){
                if(sameType){
                    newFiber = Object.assign({}, {
                        effectTag: UPDATE,
                        props: element.props
                    })
                }else{
                    //对于要删除的fiber不应该存在于原来的fiber链表中，因此需要在parent的effects中添加记录，不要在保留链表中此fiber结构数据
                    oldFiber.effectTag = DELETION;
                    fiber.effects = (fiber.effects || []).push(oldFiber)
                }

                oldFiber = oldFiber.sibling;
            }else{
                newFiber = createFiber(elm, fiber);
            }


            //由于fiber有可能会被删除,需重设链表
            prevFiber = newFiber;

            if(index == 0){
                fiber.child = newFiber;
            }else{
                prevFiber.sibling = newFiber;
            }

            index++;

        }

    }
}

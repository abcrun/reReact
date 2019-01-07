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
    var element = currentFiber.element, children = element.props.children || [];

    if(currentFiber.dom){//初始化render时，才会有dom属性
        currentFiber = createFiber(element, null);

        dealChildren(currentFiber, children)
    }else{
        if(!currentFiber.stateNode){

        }

        if((element && currentFiber = currentFiber.instance.__fiber && element.type == currentFiber.type) || (alterFiber = currentFiber.alterFiber && alterFiber.type == currentFiber.type)){
        }
        var fromSetState = !currentFiber.stateNode, currentFiber = fromSetState ? currentFiber.instance.__fiber || currentFiber, parentFiber = currentFiber.parent;
        if(fromSetState){
            currentFiber = Object.assign({}, createFiber(element, parentFiber), { alterFiber: currentFiber })
        }
        currentFiber = currentFiber.instance.__fiber || currentFiber, parentFiber = currentFiber.parent, alterFiber = currentFiber.alterFiber;
        //setState时触发, 对于自定义组件，都会存在__fiber属性(初始化render时创建)
        if(!currentFiber.stateNode){
            currentFiber = currentFiber.instance.__fiber;
            currentFiber = createFiber

        } ;

        var ;
        if(alterFiber && alterFiber.type == currentFiber.type){

        }else{

        }

        if(!element){
            parentfiber.effecttag = deletion;
            parentfiber.effects = (parentfiber.effects || []).push(currentfiber)
        }else{
            if(currentfiber.type == element.type){
                currentfiber.effecttag = update;
                currentfiber.props = element.props;
            }else{
                var oldfiber = currentfiber;
                currentfiber = createfiber(element, currentfiber.parent);

                var childfiber = parentfiber.child, prevfiber = null;;
                while(childfiber){
                    if(childfiber == oldfiber){
                        if(!prevfiber){
                            parentfiber.child = currentfiber;
                        }else{
                            prevfiber.sibling = currentfiber;
                        }
                        currentfiber.sibling = childfiber.sibling;
                        break;
                    }
                    prevsibling = childfiber;
                    childfiber = childfiber.sibling;
                }

            }

            difffiber(currentfiber, children)
        }

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



function dealChildren(fiber, children) {
    var index = 0, oldFiber = fiber.child, prevFiber = newFiber = null;
    while(index < children.length || oldFiber != null){
        var elm = index < children.length && children[index],
            sameType = oldFiber && elm && elm.type == oldFiber.type;

        if(oldFiber){
            if(sameType){
                newFiber = Object.assign(oldFiber, {
                    effectTag: UPDATE,
                    props: element.props,
                    alternate: oldFiber
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

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
    currentFiber = currentFiber || initialFiber();

    while(idleDeadline.timeRemaining() > timeUnit && currentFiber){
        currentFiber = performUnitOfWork(currentFiber);
    }

    if(pendingCommit) commitAllWork();

    if(currentFiber || renderQueue.length > 0){
        requestIdleCallback(performWork);
    }
}

function initialFiber(){
    var update = renderQueue.shift();
    if(!update) return;

    var element = update.element;
    if(update.dom){//for render
        currentFiber = createFiber(element, null);
    }else if(update.instance){//for component
        currentFiber = update.__fiber;
        var parentFiber = currentFiber.parent;
        if(!element){
            parentFiber.effectTag = DELETION;
            parentFiber.effects = (parentFiber.effects || []).push(currentFiber);
            parentFiber.child = null;

            currentFiber = parentFiber;
        }else{
            var oldFiber = currentFiber;
            if(currentFiber.type == element.type){
                currentFiber = Object.assign({}, oldFiber, {
                    effectTag: UPDATE,
                    props: element.props,
                    alterFiber: oldFiber
                })
            }else{
                currentFiber = createFiber(element, parentFiber);

                //原fiber被新fiber替换，需要将原fiber的的兄弟父子关系赋给新的fiber
                var childFiber = parentFiber.child, prevFiber = null;;
                while(childFiber){
                    if(childFiber == oldFiber){
                        if(!prevFiber){
                            parentFiber.child = currentFiber;
                        }else{
                            prevFiber.sibling = currentFiber;
                        }
                        currentFiber.sibling = childFiber.sibling;
                        break;
                    }
                    prevFiber = childFiber;
                    childFiber = childFiber.sibling;
                }
            }
        }
    }

    return currentFiber;
}

function performUnitOfWork(currentFiber){
    var children = currentFiber.props.children || [];
    dealChildren(currentFiber, children);

    if(currentFiber.child){
        return currentFiber.child;
    }

    var fiber = currentFiber;
    while(fiber){
        completeWork(fiber);
        if(fiber.sibling){
            return fiber.sibling;
        }
        fiber = fiber.parent;
    }
}

function completeWork(fiber){
    var parentFiber = fiber.parent;

    if(parentFiber){
        parentFiber.effects = (parentFiber.effects || []).concat([fiber], (fiber.effects || []));
    }else{
        pendingCommit = true;
    }
}

function commitAllWork(){
    currentFiber.effects.forEach(function(fiber){
        var tag = fiber.effectTag;
        //具体node操作省略
        switch(tag){
            case PLACEMENT:
                break;
            case UPDATE:
                break;
            case DELETION:
                break;
        }
    })
}

//创建实例
function createFiber(element, parentFiber) {
    var dom, props = element.props, hasChildren = props.children.length, children = hasChildren ? props.children : [];
    var isElement = element.nodeType == ELEMENT, isText = element.nodeType == TEXT, isComponent = element.nodeType == COMPONENT;
    var fiber = {};

    if(isElement){
        dom = document.createElement(element.type);

        fiber.stateNode = dom;
        fiber.type = element.type;
        fiber.effectTag = PLACEMENT;
        fiber.props = props;
        fiber.parent = parentFiber || null;


    }else if(isComponent){
        var instance = new element.type(props), componentElement = instance.render();
        props.children = componentElement;

        fiber.stateNode = instance;
        fiber.type = element.type;
        fiber.effectTag = PLACEMENT;
        fiber.props = props;
        fiber.parent = parentFiber || null;

        instance.__fiber = componentFiber;
    }else if(isText){
        dom = document.createTextNode(element.nodeValue);

        fiber = { statNode: dom, props: element.props, effectTag: PLACEMENT };
    }

    return fiber;
}



function dealChildren(fiber, children) {
    var index = 0, oldFiber = fiber.child, prevFiber = newFiber = null;
    while(index < children.length || oldFiber != null){
        var elm = index < children.length && children[index];
        /*if(elm.nodeType == COMPONENT){
            var component = new elm.type();
            elm = component.render();
        }*/

        var sameType = oldFiber && elm && elm.type == oldFiber.type;

        //有oldFiber说明已经存在Fiber链表，是setState操作
        if(oldFiber){
            if(sameType){
                newFiber = Object.assign(oldFiber, {
                    effectTag: UPDATE,
                    props: elm.props,
                    alternate: oldFiber
                })
            }else{
                if(!elm){
                    //对于要删除的fiber不应该存在于原来的fiber链表中，因此需要在parent的effects中添加记录，不要在保留链表中此fiber结构数据
                    oldFiber.effectTag = DELETION;
                    fiber.effects = (fiber.effects || []).push(oldFiber)
                }else{
                }
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

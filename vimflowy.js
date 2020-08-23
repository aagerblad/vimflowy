
const mainContainer = document.getElementById('app');
const {flashMode, goToInsertMode, goToNormalMode, goToVisualMode, goToReplaceMode, goToFindMode, goToInnerMode, goToAfterMode} = modeClosure(mainContainer, state.get, state.set);

WFEventListener = event => 
{
  // console.log(event);
  if(event === "documentReady")
    requestAnimationFrame(fixFocus);

};

mainContainer.addEventListener('mousedown', event => 
{ 
  mouseClickIntoInsertMode(event);
});

mainContainer.addEventListener('keyup', event => 
{ 
  HandleEasyMotion_KeyUp();
  reselectItemsBeingMoved();
  updateKeyBuffer_Keyup(event);
});

mainContainer.addEventListener('keydown', event => 
{ 
    if(HandleEasyMotion_KeyDown(event))
    {
      // console.log("-- HandleEasyMotion early out -- ")
      event.preventDefault()
      event.stopPropagation()
      return;
    }

    if(updateKeyBuffer_Keydown(event))
    {
      // console.log("-- KeybufferDownKey early out -- ")
      event.preventDefault()
      event.stopPropagation()
      return;
    }

    if (state.get().mode === Mode.FIND)
    {
      event.preventDefault()
      event.stopPropagation()
      handleFindMode(event);
    }
    else if (state.get().mode === Mode.REPLACE)
    {
      event.preventDefault()
      event.stopPropagation()
      handleReplaceMode(event);
    }
    else if (state.get().mode === Mode.INNER)
    {
      event.preventDefault()
      event.stopPropagation()
      handleInnerMode(event);
    }
    else if (state.get().mode === Mode.AFTER)
    {
      event.preventDefault()
      event.stopPropagation()
      handleAfterMode(event);
    }
    else if (keyBuffer.length > 1 && transparentActionMap[state.get().mode][keyBuffer[keyBuffer.length-2]+keyBuffer[keyBuffer.length-1]]) 
    {
      // handle sequence bindings
      transparentActionMap[state.get().mode][keyBuffer[keyBuffer.length-2]+keyBuffer[keyBuffer.length-1]](event);
      keyBuffer = [];
      // console.log("-- Sequence Map -- ")
    }
    else if (actionMap[state.get().mode][keyFrom(event)]) 
    {
      // handle simple bindings that always block propagation
      actionMap[state.get().mode][keyFrom(event)](event.target)
      event.preventDefault()
      event.stopPropagation()
      // console.log("-- Action Map -- ")
    }
    else if (transparentActionMap[state.get().mode][keyFrom(event)]) 
    {
      // handle bindings that sometimes block propagation
      transparentActionMap[state.get().mode][keyFrom(event)](event)
      // console.log("-- Transparent Map -- ")
    }
    else
    {
      preventKeystrokesWhileNavigating(event);
      // console.log("-- Preventing defaults -- ")
    }

    if(bShowTimeCounter)
        updateTimeTagCounter();

    // console.log("currentOffset keydown: " + state.get().anchorOffset);

})

// we can't use WF.getSelection()
// because WF.setSelection() will 
// remove any of the added items 
// if they are children of any 
// of the other items which were added
let VisualSelectionBuffer = [];
let PrevEnterItem = null;
let SelectionPreMove = [];
let InitialSelectionItem = null;
let focusPreJumpToItemMenu = null;
let bKeyDownHasFired = false;
let bShowTimeCounter = false;
let keyBufferTempCopy = [];
let keyBuffer = [];
let yankBuffer = [];
const validSearchKeys = '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzäåöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ ';
const validInputKeys =  '1234567890[{]};:\'",<.>/?\\+=_-)(*&^%$#@~`!abcdefghijklmnopqrstuvwxyzåäöABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ';
const key_Slash = "/"//55;
const key_Esc = "Escape"//27;
const modifierKeyCodesToIgnore = ['Shift', 'Control', 'Alt', 'Meta'];  

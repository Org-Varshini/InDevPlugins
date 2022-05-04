/* global Adobe: readonly -- Declared by the QuickJS runtime */
/* global __html__: readonly -- Declared by the QuickJS runtime */
if (Adobe.editorType === 'canvas') {
    Adobe.showUI(__html__);
    Adobe.ui.onmessage = msg => {
        switch (msg.type) {
            case 'create-text': {
                let nodes = [];
                const count = msg.data ? msg.data.count: msg.count;
                for (let i = 0; i < count; i++) {
                    let node = Adobe.createText();
                    nodes.push(node);
                }
                Adobe.currentPage.setSelection(nodes);
            }
            break;
            case 'create-ellipse': {
                let nodes = [];
                const count = msg.data ? msg.data.count: msg.count;
                for (let i = 0; i < count; i++) {
                    let node = Adobe.createEllipse();
                    nodes.push(node);
                }
                Adobe.currentPage.setSelection(nodes);
            }
            break;
            case 'create-rectangle': {
                let nodes = [];
                const count = msg.data ? msg.data.count: msg.count;
                for (let i = 0; i < count; i++) {
                    let node = Adobe.createRectangle();
                    nodes.push(node);
                }
                Adobe.currentPage.setSelection(nodes);
            }
            break;
            case 'create-line': {
                let nodes = [];
                const count = msg.data ? msg.data.count: msg.count;
                for (let i = 0; i < count; i++) {
                    let node = Adobe.createLine();
                    nodes.push(node);
                }
                Adobe.currentPage.setSelection(nodes);
            }
            break;
        }
    };
}

class Renderer
{
    constructor(canvasId)
    {
        this.instanceSize = 1000;
        this.renderList   = []
        this.renderMap    = new Map();
        this.renderGroups = new Map();
        this.context      = new Context(canvasId);
        this.camera       = null;
    }
    
    drawScene(frameNumber, timeElapsed, delta)
    {
        var drawStats = [0, 0];
        var frameInfo = [frameNumber, timeElapsed, delta, 0];

        // Clear the frame buffer and update the view matrix
        this.context.clearBuffers();
        this.context.viewMatrix = this.camera.viewMatrix();
        
        // Iterate over each collection of material:mesh combinations
        let renderIter = this.renderGroups.keys();
        let renderEntry = renderIter.next();

        while(!renderEntry.done)
        {
            let key = renderEntry.value;
            let renderObjects = this.renderGroups.get(key);
            renderEntry = renderIter.next();

            if(renderObjects.length == 0)
            {
                continue;
            }
            
            let material = renderObjects[0].renderable._materialReference;
            let mesh = renderObjects[0].renderable._meshReference;

            if((material == null) || (mesh == null))
            {
                continue;
            }

            material.setUniformVec4("FrameInfo", frameInfo);
            
            // Render the individual objects associated with this material:mesh combo
            let results = [0, 0];     // [draw calls, triangles drawn]

            if(material.instanced === false)
            {
                results = this.drawSceneNoInstancing(delta, renderObjects, mesh, material);
            }
            else
            {
                results = this.drawSceneInstancing(delta, renderObjects.length, mesh, material);
            }
            
            drawStats[0] += results[0];
            drawStats[1] += results[1];
        }

        // Clear the render groups. We do this so that we are ensured
        // that we are only tracking valid, up-to-date scene objects.
        this.clearRenderGroups();

        return drawStats;
    }

    /**
     * Renders each object individually.
     * 
     * @param {*} delta 
     */
    drawSceneNoInstancing(delta, sceneObjects, mesh, material)
    {
        if(!material.bind())
        {
            return [0, 0];
        }

        let drawCalls = 0;
        let triangles = 0;

        for(let i = 0; i < sceneObjects.length; ++i)
        {
            material.bindNonInstancedProperties(sceneObjects[i]);
            triangles += mesh.render();
            drawCalls++;
        }

        return [drawCalls, triangles];
    }

    /**
     * Renders the entire collection of SceneObjects in a single instance.
     * 
     * @param {*} delta 
     * @param {*} count 
     * @param {*} mesh 
     * @param {*} material 
     */
    drawSceneInstancing(delta, count, mesh, material)
    {
        if(!material.bind())
        {
            return [0, 0];
        }

        let leftToRender = count;
        let numInstances = Math.ceil(count / this.instanceSize);
        let triangles    = 0;
        let instance     = 0;

        while(leftToRender > 0)
        {
            let countBound = material.bindInstanced(mesh.resourceName, instance++);
            triangles += mesh.renderInstanced((leftToRender >= countBound ? countBound : leftToRender));
            material.unbindInstanced();

            leftToRender -= countBound;
        }
        
        return [numInstances, triangles];
    }


    /**
     * Adds the SceneObject that should be rendered this frame to the renderer.
     * 
     * At the end of each render routine, the underlying container of objects to render is cleared.
     * Because of this, the SceneObject needs to be added to the Renderer for each frame.
     * 
     * @param {SceneObject} object 
     */
    addRenderObject(sceneObject)
    {
        let material = sceneObject.renderable._materialReference;
        let mesh = sceneObject.renderable._meshReference;

        if((material === null) || (mesh === null))
        {
            console.error("Requested to queue scene object for rendering with a null mesh and/or material");
            return false;
        }

        let pair = Utils.cantorPair(material.resourceId, mesh.resourceId);

        if(!this.renderGroups.has(pair))
        {
            this.renderGroups.set(pair, [sceneObject]);
        }
        else
        {
            this.renderGroups.get(pair).push(sceneObject);
        }

        sceneObject.renderIndex = this.renderGroups.get(pair).length - 1;
        return true;
    }

    removeRenderObject(sceneObject)
    {
        if(sceneObject.renderIndex == -1)
        {
            return true;
        }

        let material = sceneObject.renderable._materialReference;
        let mesh = sceneObject.renderable._meshReference;

        if((material === null) || (mesh === null))
        {
            console.error("Requested to remove render object with a null mesh and/or material");
            return false;
        }

        let pair = Utils.cantorPair(material.resourceId, mesh.resourceId);
        
        if(this.renderGroups.has(pair))
        {pair
            this.renderGroups.get(pair).splice(sceneObject.renderIndex, 1);
            sceneObject.renderIndex = -1;
        }

        return true;
    }

    clearRenderGroups()
    {
        let renderIter = this.renderGroups.keys();
        let renderEntry = renderIter.next();

        while(!renderEntry.done)
        {
            this.renderGroups.set(renderEntry.value, []);
            renderEntry = renderIter.next();
        }
    }
}
class Renderer
{
    constructor(canvasId)
    {
        this.defaultMesh              = "quad";
        this.defaultMaterial          = "default";
        this.defaultInstancedMaterial = "default_instanced";
        this.instanceSize             = 1000;

        this.renderList = []
        this.renderMap  = new Map();
        this.context    = new Context(canvasId);
        this.meshes     = new Map();
        this.shaders    = new Map();
        this.materials  = new Map();
        this.camera     = null;
    }
    
    drawScene(delta)
    {
        let drawCalls = 0;

        // Clear the frame buffer and update the view matrix
        this.context.clearBuffers();
        this.context.viewMatrix = this.camera.viewMatrix();
        
        // Iterate over each collection of material:mesh combinations
        let renderIter = this.renderMap.keys();
        let renderEntry = renderIter.next();

        while(!renderEntry.done)
        {
            let members      = renderEntry.value.split(":");
            let materialName = members[0];
            let meshName     = members[1];
            let material     = this.materials.get(materialName);
            let mesh         = this.meshes.get(meshName);

            if((material == null) || (mesh == null))
            {
                continue;
            }
            
            // Render the individual objects associated with this material:mesh combo
            let sceneObjects = this.renderMap.get(renderEntry.value);
            
            if(material.instanced === false)
            {
                drawCalls += this.drawSceneNoInstancing(delta, sceneObjects, mesh, material);
            }
            else
            {
                drawCalls += this.drawSceneInstancing(delta, sceneObjects, meshName, mesh, material);
            }
            

            renderEntry = renderIter.next();
        }

        // Clear the render map. We do this so that we are ensured
        // that we are only tracking valid, up-to-date scene objects.
        this.clearRenderMap();

        return drawCalls;
    }

    /**
     * Renders each object individually.
     * 
     * @param {*} delta 
     */
    drawSceneNoInstancing(delta, sceneObjects, mesh, material)
    {
        let drawCalls = 0;

        if(!material.bind())
        {
            return drawCalls;
        }

        for(let i = 0; i < sceneObjects.length; ++i)
        {
            material.bindNonInstancedProperties(sceneObjects[i]);
            mesh.render(this.context);
            drawCalls++;
        }

        return drawCalls;
    }

    /**
     * Renders the entire collection of SceneObjects in a single instance.
     * 
     * @param {*} delta 
     * @param {*} sceneObjects 
     * @param {*} mesh 
     * @param {*} material 
     */
    drawSceneInstancing(delta, sceneObjects, meshName, mesh, material)
    {
        if(sceneObjects.length == 0)
        {
            return 0;
        }

        if(!material.bind())
        {
            return 0;
        }

        let leftToRender = sceneObjects.length;
        let numInstances = Math.ceil(sceneObjects.length / this.instanceSize);

        for(let i = 0; i < numInstances; ++i)
        {
            material.bindInstanced(meshName, i);
            mesh.renderInstanced(this.context, (leftToRender >= this.instanceSize ? this.instanceSize : leftToRender));
            material.unbindInstanced(this.context);

            leftToRender -= this.instanceSize;
        }
        
        return numInstances;
    }

    /**
     * Adds the SceneObject that should be rendered this frame to the renderer.
     * 
     * At the end of each render routine, the underlying container of objects to render is cleared.
     * Because of this, the SceneObject needs to be added to the Renderer for each frame.
     * 
     * @param {SceneObject} object 
     */
    addRenderObject(object)
    {
        // Internally we don't track the actual SceneObject itself but rather
        // it's rendering related properties. The renderMap uses the concatenation
        // of the material id and mesh id which then points to a map of model matrices.

        // As such, all objects that use the same material+mesh combination will end
        // up in the same render bucket.

        if(object.renderIndex != -1)
        {
            console.warn("!");
        }
        
        let renderId = object.renderable.material + ":" + object.renderable.mesh;

        if(!this.renderMap.has(renderId))
        {
            this.renderMap.set(renderId, [object]);
        }
        else
        {
            this.renderMap.get(renderId).push(object);
        }

        object.renderIndex = this.renderMap.get(renderId).length - 1;
    }

    removeRenderObject(object)
    {
        if(object.renderIndex == -1)
        {
            return;
        }

        let renderId = object.renderable.material + ":" + object.renderable.mesh;
        
        if(this.renderMap.has(renderId))
        {
            this.renderMap.get(renderId).splice(object.renderIndex, 1);
            object.renderIndex = -1;
        }
    }

    clearRenderMap()
    {
        let renderIter = this.renderMap.keys();
        let renderEntry = renderIter.next();

        while(!renderEntry.done)
        {
            this.renderMap.set(renderEntry.value, []);
            renderEntry = renderIter.next();
        }
    }
}
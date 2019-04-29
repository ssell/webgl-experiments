class Renderer
{
    constructor(canvasId)
    {
        this.context   = new Context(canvasId);
        this.meshes    = new Map();
        this.shaders   = new Map();
        this.materials = new Map();
        this.camera    = new Camera(this);

        this.enableInstancing = true;

        this.renderList = []
        this.renderMap = new Map();
    }
    
    drawScene(delta)
    {
        let drawCalls = 0;

        // Clear the frame buffer and update the view matrix
        this.context.clearBuffers();
        this.context.viewMatrix = this.camera.viewMatrix();

        if(this.enableInstancing)
        {
            drawCalls = this.drawSceneInstancing(delta);
        }
        else
        {
            drawCalls = this.drawSceneNoInstancing(delta);
        }

        // Clear the render map. We do this so that we are ensured
        // that we are only tracking valid, up-to-date scene objects.
        this.renderMap.clear();

        return drawCalls;
    }

    /**
     * Renders each object individually.
     * @param {*} delta 
     */
    drawSceneNoInstancing(delta)
    {
        let drawCalls = 0;

        // Iterate over each collection of material:mesh combinations
        let renderIter = this.renderMap.keys();
        let renderEntry = renderIter.next();

        while(!renderEntry.done)
        {
            let members  = renderEntry.value.split(":");
            let material = this.materials.get(members[0]);
            let mesh     = this.meshes.get(members[1]);

            if((material == null) || (mesh == null))
            {
                continue;
            }
            
            // Render the individual model matrices associated with this material:mesh combo
            let matrices = this.renderMap.get(renderEntry.value);

            for(let i = 0; i < matrices.length; ++i)
            {
                this.context.modelMatrix = matrices[i];

                material.bind(this.context);
                mesh.render(this.context);
                drawCalls++;
            }

            renderEntry = renderIter.next();
        }

        return drawCalls;
    }

    /**
     * Renders objects in groups using instancing.
     * Objects that share the same mesh and material are rendered in a single call.
     * 
     * @param {*} delta 
     */
    drawSceneInstancing(delta)
    {
        let drawCalls = 0;

        return drawCalls;
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

        let renderId = object.material + ":" + object.mesh;

        if(!this.renderMap.has(renderId))
        {
            this.renderMap.set(renderId, [object.modelMatrix()]);
        }
        else
        {
            this.renderMap.get(renderId).push(object.modelMatrix());
        }
    }
}
/**
 * Contains and manages the objects which compose a visual scene.
 */
class Scene
{
    constructor(canvasId)
    {
        this.renderer      = new Renderer(canvasId);
        this.frameStats    = new FrameStats(this.renderer.context);
        this.sceneObjects  = [];
        this.lastFrameTime = 0.0;
        this.deltaTime     = 0.0;
    }

    setup()
    {
        this.buildDefaultShaders();
        this.buildDefaultMaterials();
        
        this.buildQuadMesh();

        this.renderer.camera = new Camera(this.renderer); 
    }

    start()
    {
        requestAnimationFrame(()=>this.frame());
    }

    /**
     * Builds several default shaders, including:
     * 
     *     - `flat`
     *     - `flat_instanced`
     *     - `flash`
     *     - `flash_instanced`
     */
    buildDefaultShaders()
    {
        let shaderFlat = new Shader(this.renderer.context, shader_flat_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flat", shaderFlat);

        let shaderFlatInstanced = new Shader(this.renderer.context, shader_flat_instanced_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flat_instanced", shaderFlatInstanced);

        let shaderFlash = new Shader(this.renderer.context, shader_flash_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flash", shaderFlash);

        let shaderFlashInstanced = new Shader(this.renderer.context, shader_flash_instanced_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flash_instanced", shaderFlashInstanced);
    }

    /**
     * Builds several default materials, including:
     * 
     *     - `default`
     *     - `default_instanced`
     *     - `flash`
     *     - `flash_instanced`
     */
    buildDefaultMaterials()
    {
        let materialDefault = new Material(this.renderer, "default", "flat");
        materialDefault.enableProperty("Color", [1.0, 1.0, 1.0, 1.0],);
        this.renderer.materials.set(materialDefault.name, materialDefault);

        let materialDefaultInstanced = new Material(this.renderer, "default_instanced", "flat_instanced", true);
        materialDefaultInstanced.enableProperty("Color", [1.0, 1.0, 1.0, 1.0]);
        this.renderer.materials.set(materialDefaultInstanced.name, materialDefaultInstanced);
        
        let materialFlash = new Material(this.renderer, "flash", "flash");
        materialFlash.enableProperty("StartColor", [0.0, 0.0, 0.0, 1.0]);
        materialFlash.enableProperty("EndColor", [1.0, 1.0, 1.0, 1.0]);
        this.renderer.materials.set(materialFlash.name, materialFlash);
        
        let materialFlashInstanced = new Material(this.renderer, "flash_instanced", "flash_instanced", true);
        materialFlashInstanced.enableProperty("StartColor", [0.0, 0.0, 0.0, 1.0]);
        materialFlashInstanced.enableProperty("EndColor", [1.0, 1.0, 1.0, 1.0]);
        this.renderer.materials.set(materialFlashInstanced.name, materialFlashInstanced);
    }

    buildQuadMesh()
    {
        let quad = new Mesh();

        quad.vertices.push(new Vertex(-0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0), 
                           new Vertex( 0.5, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0), 
                           new Vertex( 0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0),
                           new Vertex(-0.5,  0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0));

        quad.indices.push(0, 1, 2, 
                          2, 3, 0)

        quad.build(this.renderer.context);

        this.renderer.meshes.set("quad", quad);
    }

    frame(elapsedTime)
    {
        if(isNaN(elapsedTime))
        {
            elapsedTime = performance.now();
        }

        elapsedTime *= 0.001;                   // Convert to ms

        this.deltaTime     = elapsedTime - this.lastFrameTime;
        this.lastFrameTime = elapsedTime;

        for(var i = 0; i < this.sceneObjects.length; ++i)
        {
            var sceneObject = this.sceneObjects[i];
            sceneObject.update(this.deltaTime);
        }

        for(var i = 0; i < this.sceneObjects.length; ++i)
        {
            if(this.sceneObjects[i].visible)
            {
                this.sceneObjects[i].preRender();
            }
        }

        let drawStats = this.renderer.drawScene(0, this.frameStats.timeElapsed, this.deltaTime);

        this.frameStats.endFrame(this.deltaTime, drawStats[0], drawStats[1]);
        this.frameStats.report();

        requestAnimationFrame(()=>this.frame());
    }
}

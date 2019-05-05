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
        this.buildFlatShader();
        this.buildFlatInstancedShader();
        this.buildFlashingShader();

        this.buildDefaultMaterial();
        this.buildDefaultInstancedMaterial();
        this.buildFlashingMaterial();
        
        this.buildQuadMesh();

        this.renderer.camera = new Camera(this.renderer); 
    }

    start()
    {
        requestAnimationFrame(()=>this.frame());
    }

    buildFlatShader()
    {
        let shader = new Shader(this.renderer.context, shader_flat_vs, null, shader_flat_fs);
        this.renderer.shaders.set("flat", shader);
    }

    buildFlatInstancedShader()
    {
        let shader = new Shader(this.renderer.context, shader_flat_vs_instanced, null, shader_flat_fs);
        this.renderer.shaders.set("flat_instanced", shader);
    }

    buildFlashingShader()
    {
        let shader = new Shader(this.renderer.context, shader_flash_vs_instanced, null, shader_flat_fs);
        this.renderer.shaders.set("shader_flash_instanced", shader);
    }

    buildDefaultMaterial()
    {
        let material = new Material(this.renderer, "default", "flat");

        material.enableProperty("Color", 4, [1.0, 0.0, 1.0, 1.0],);

        this.renderer.materials.set(material.name, material);
    }

    buildDefaultInstancedMaterial()
    {
        let material = new Material(this.renderer, "default_instanced", "flat_instanced", true);

        material.enableProperty("Color", 4, [1.0, 1.0, 1.0, 1.0]);

        this.renderer.materials.set(material.name, material);
    }

    buildFlashingMaterial()
    {
        let material = new Material(this.renderer, "flash_instanced", "shader_flash_instanced", true);

        material.enableProperty("StartColor", 4, [0.0, 0.0, 0.0, 1.0]);
        material.enableProperty("EndColor", 4, [1.0, 1.0, 1.0, 1.0]);

        this.renderer.materials.set(material.name, material);
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

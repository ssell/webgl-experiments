var scene = null;

function createQuadTreeVisualizerMaterial()
{
    let shader = new Shader(
        scene.renderer.context, 
        "quadtree_visualizer_shader", 
        shader_quadtree_visualizer_vs, 
        null, 
        shader_quadtree_visualizer_fs);
    
    let material = new Material(
        scene.renderer, 
        "quadtree_visualizer", 
        "quadtree_visualizer_shader");

    // [ width, height, center x, center y ]
    material.enableProperty("QuadTreeInfo", [ 0.0, 0.0, 0.0, 0.0 ]);  
}

function setupScene()
{
    scene = new Scene("glCanvas");

    scene.setSceneTree(new QuadTree(50, 50, 0, 0, 6));
    scene.setup();
    
    scene.renderer.camera.clearColor(0.098, 0.098, 0.196);
    scene.renderer.camera.transform.translate(0.0, 0.0, 62.0);

    createQuadTreeVisualizerMaterial();
    scene.addSceneObject(new QuadTreeDebugObject(scene.renderer, scene.sceneTree));

    //spawnQuad();

    scene.start();
}

function spawnQuad(x = Utils.getRandom(-25, 25), y = Utils.getRandom(-25, 25))
{
    let quad = new QuadObject(scene.renderer);
    quad.translate(x, y, 0);
    scene.addSceneObject(quad);
}

function updateTreeOutput()
{
    $("#tree_output").html(scene.sceneTree.debugTraverse());
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function handleSpawnClick(mousePos)
{
    const worldPos = scene.renderer.camera.screenToWorld(mousePos.x, mousePos.y, -scene.renderer.camera.transform.position[2]);
    spawnQuad(Utils.clamp(worldPos[0], -24.5, 24.5), Utils.clamp(worldPos[1], -24.5, 24.5));
}

function handleDeleteClick(mousePos)
{
    const ray = scene.renderer.camera.screenToRay(mousePos.x, mousePos.y);
    const selected = scene.sceneTree.findIntersectionsRay(ray);

    console.log(selected.length);

    if(selected.length != 0)
    {
        scene.removeSceneObject(selected[0].id);
    }
}

$(document).ready(function()
{
    setupScene();
    updateTreeOutput();

    $(scene.renderer.context.canvas).click(function(event)
    {
        const mousePos = getMousePos(scene.renderer.context.canvas, event);
        
        // Shift + Click deletes
        if(event.shiftKey)
        {
            handleDeleteClick(mousePos);
        }
        else
        {
            handleSpawnClick(mousePos);
        }
    });

    $("#spawn_quad").click(function()
    {
        spawnQuad();
    })

    $("#output_tree").click(function()
    {
        updateTreeOutput();
    });
});
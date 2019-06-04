const qtDimension = 50.0;
const qtMaxDepth  = 6;
const quadMaxPos  = 24.5;    // Max position of a quad on x or y axis. Account for quad width to not let it extend beyond QT edge.
                             // The QT will still function if it extends beyond, but we prevent it for visual purposes.
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

    scene.setSceneTree(new QuadTree(qtDimension, qtDimension, 0.0, 0.0, qtMaxDepth));
    scene.setup();
    
    scene.renderer.camera.clearColor(0.098, 0.098, 0.196);
    scene.renderer.camera.transform.translate(0.0, 0.0, 62.0);

    createQuadTreeVisualizerMaterial();
    scene.addSceneObject(new QuadTreeDebugObject(scene.renderer, scene.sceneTree));

    // Begin the scene with 10 quads in it to display the QT structure
    for(let i = 0; i < 10; ++i)
    {
        spawnQuad();
    }

    scene.start();
}

function spawnQuad(x = Utils.getRandom(-quadMaxPos, quadMaxPos), y = Utils.getRandom(-quadMaxPos, quadMaxPos))
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
    spawnQuad(Utils.clamp(worldPos[0], -quadMaxPos, quadMaxPos), Utils.clamp(worldPos[1], -quadMaxPos, quadMaxPos));
}

function handleDeleteClick(mousePos)
{
    const ray = scene.renderer.camera.screenToRay(mousePos.x, mousePos.y);
    const selected = scene.sceneTree.findIntersectionsRay(ray);

    console.log(selected.length);

    if(selected.length != 0)
    {
        if(selected[0].id == 0)
        {
            // In this scene, object 0 will always be the QuadTreeDebugObject which visualizes the tree.
            // Obviously we do not want to allow deletion of this object, so prevent it here.
            if(selected.length > 1)
            {
                // Instead, delete the next selected object
                scene.removeSceneObject(selected[1].id);
            }
        }
        else
        {
            scene.removeSceneObject(selected[0].id);
        }
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
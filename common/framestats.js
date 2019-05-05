/**
 * Data stored about a single frame.
 */
class Frame
{
    constructor()
    {
        this.count     = 0;
        this.delta     = 0.0;
        this.drawCalls = 0;
        this.triangles = 0;
    }
}

/**
 * Helper which keeps track of frame statistics for the last N frames.
 * This class can also report the results out to specific elements:
 * 
 *     #value_frame     - The current frame count.
 *     #value_fps       - The running FPS, over N frames.
 *     #value_ms        - The running ms-per-frame, over N frames.
 *     #value_drawcalls - The number of draw calls in the last frame.
 */
class FrameStats
{
    constructor(context)
    {
        this.context      = context;
        this.frames       = [];
        this.maxFrames    = 50;
        this.runningDelta = 0.0;
        this.timeElapsed  = 0.0;
        this.delayStart   = 2;
    }

    flush()
    {
        this.frames       = [];
        this.runningDelta = 0.0;
        this.delayStart   = 2;
    }

    endFrame(delta, drawCalls, trianglesDrawn)
    {
        if(this.delayStart > 0)
        {
            // Wait a few frames before recording as the first frame will always be extra long due to scene creation
            this.delayStart--;
            return;
        }

        var frame = new Frame();

        if(this.frames.length > 0)
        {
            frame.count = this.frames[0].count + 1;
        }

        frame.delta     = delta;
        frame.drawCalls = drawCalls;
        frame.triangles = trianglesDrawn;

        this.frames.unshift(frame);
        this.runningDelta += delta;
        this.timeElapsed  += delta;

        if(this.frames.length > this.maxFrames)
        {
            this.runningDelta -= this.frames[this.maxFrames].delta;
            this.frames.pop();
        }
    }

    report()
    {
        if(this.frames.length == 0)
        {
            return;
        }

        var fps = (1.0) / (this.runningDelta / this.frames.length);
        var ms = (this.runningDelta / this.frames.length) * 1000.0;

        $("#value_frame").text(this.frames[0].count);
        $("#value_fps").text(fps.toFixed(2));
        $("#value_ms").text(ms.toFixed(2));
        $("#value_triangles").text(this.frames[0].triangles);
        $("#value_drawcalls").text(this.frames[0].drawCalls);
    }
}
/**
 * Data stored about a single frame.
 */
class Frame
{
    constructor()
    {
        this.count = 0;
        this.delta = 0.0;
        this.drawCalls = 0;
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
    constructor()
    {
        this.frames = [];
        this.maxFrames = 30;
        this.runningDelta = 0.0;
    }

    addFrame(delta, drawCalls)
    {
        var frame = new Frame();

        if(this.frames.length > 0)
        {
            frame.count = this.frames[0].count + 1;
        }

        frame.delta = delta;
        frame.drawCalls = drawCalls;

        this.frames.unshift(frame);
        this.runningDelta += delta;

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
        $("#value_drawcalls").text(this.frames[0].drawCalls);
    }
}
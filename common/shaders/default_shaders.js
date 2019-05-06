const shader_flat_vs = shader_common_vs + `
    uniform vec4 Color;
    varying lowp vec4 vColor;

    void main()
    {
        gl_Position = transformPosition();
        vColor = Color;
    }
`;

const shader_flat_instanced_vs = shader_common_vs_instanced + `
    attribute vec4 Color;
    varying lowp vec4 vColor;

    void main()
    {
        gl_Position = transformPosition();
        vColor = Color;
    }
`;

const shader_flat_fs = shader_common_fs + `
    varying lowp vec4 vColor;

    void main()
    {
        gl_FragColor = vColor;
    }
`;

const shader_flash_vs = shader_common_vs + `
    uniform vec4 StartColor;
    uniform vec4 EndColor;

    varying lowp vec4 vColor;

    void main()
    {
        gl_Position = transformPosition();
        vColor = vec4(mix(StartColor, EndColor, (sin(FrameInfo.y) + 1.0) * 0.5));
    }
`;

const shader_flash_instanced_vs = shader_common_vs_instanced + `
    attribute vec4 StartColor;
    attribute vec4 EndColor;

    varying lowp vec4 vColor;

    void main()
    {
        gl_Position = transformPosition();
        vColor = vec4(mix(StartColor, EndColor, (sin(FrameInfo.y) + 1.0) * 0.5));
    }
`;
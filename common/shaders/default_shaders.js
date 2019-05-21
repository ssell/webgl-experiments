const shader_flat_vs = shader_common_vs + glsl`
    uniform vec4 Color;
    out vec4 VertColor;

    void main()
    {
        gl_Position = transformPosition();
        VertColor = Color;
    }
`;

const shader_flat_instanced_vs = shader_common_vs_instanced + glsl`
    in vec4 Color;
    out vec4 VertColor;

    void main()
    {
        gl_Position = transformPosition();
        VertColor = Color;
    }
`;

const shader_flat_fs = shader_common_fs + glsl`
    in vec4 VertColor;

    void main()
    {
        fragColor = VertColor;
    }
`;

const shader_flash_vs = shader_common_vs + glsl`
    out vec4 StartColor;
    out vec4 EndColor;
    out vec4 VertColor;

    void main()
    {
        gl_Position = transformPosition();
        VertColor = vec4(mix(StartColor, EndColor, (sin(FrameInfo.y) + 1.0) * 0.5));
    }
`;

const shader_flash_instanced_vs = shader_common_vs_instanced + glsl`
    in vec4 StartColor;
    in vec4 EndColor;
    out vec4 VertColor;

    void main()
    {
        gl_Position = transformPosition();
        VertColor = vec4(mix(StartColor, EndColor, (sin(FrameInfo.y) + 1.0) * 0.5));
    }
`;
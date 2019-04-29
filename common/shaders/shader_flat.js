const shader_flat_vs = shader_common_vs + `
    uniform vec4 Color;
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
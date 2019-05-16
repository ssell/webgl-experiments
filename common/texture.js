class Texture extends Resource
{
    constructor(context, name, )
    {
        super(context, name, ResourceType.Texture);

        this.level          = 0;
        this.width          = 1;
        this.height         = 1;
        this.border         = 0;
        this.internalFormat = context.gl.RGBA;
        this.sourceFormat   = context.gl.RGBA;
        this.sourceType     = context.gl.FLOAT;
        this.data           = [];
        this.generateMips   = false;
        this.glTexture      = context.gl.createTexture();
    }

    build()
    {
        let pixels = null;

        switch(this.sourceType)
        {
            case context.gl.FLOAT:
                pixels = new Float32Array(this.data.length);
                break;

            case context.gl.UNSIGNED_BYTE:
                pixels = new Uint8Array(this.data.length);
                break;

            default:
                console.error("Unsupported source type");
                return;
        }

        for(let i = 0; i < data.length; ++i)
        {
            pixels[i] = this.data[i];
        }

        this.context.gl.bindTexture(this.context.gl.TEXTURE_2D, this.glTexture);

        this.context.gl.texImage2D(
            this.context.gl.TEXTURE_2D,
            this.level, 
            this.internalFormat, 
            this.width, 
            this.height, 
            this.border, 
            this.sourceFormat, 
            this.sourceType,
            pixels);

        if(this.generateMips)
        {
            this.context.gl.generateMipmap(this.context.gl.TEXTURE_2D);
        }
        else
        {
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_WRAP_S, this.context.gl.CLAMP_TO_EDGE);
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_WRAP_T, this.context.gl.CLAMP_TO_EDGE);
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_MIN_FILTER, this.context.gl.LINEAR);
        }
    }

    bind(index, shader)
    {
        switch(index)
        {
            case 0:
                this._bindInternal(0, this.context.gl.TEXTURE0, shader.sampler0);
                break;
                
            case 1:
                this._bindInternal(1, this.context.gl.TEXTURE1, shader.sampler1);
                break;
            
            case 2:
                this._bindInternal(2, this.context.gl.TEXTURE2, shader.sampler2);
                break;
                
            case 3:
                this._bindInternal(3, this.context.gl.TEXTURE3, shader.sampler3);
                break;
        }
    }

    _bindInternal(index, textureIndex, uniform)
    {
        if(uniform == -1)
        {
            return;
        }
        
        this.context.gl.activeTexture(textureIndex);
        this.context.gl.bindTexture(this.context.gl.TEXTURE_2D, this.glTexture);
        this.context.gl.uniform1i(uniform, index);
    }
}
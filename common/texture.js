class Texture extends Resource
{
    /**
     * 
     * For valid internalFormat/sourceFormat/sourceType combinations see tables in '3.7.6 Texture objects`
     * https://www.khronos.org/registry/webgl/specs/latest/2.0/
     * 
     * @param {*} context 
     * @param {*} name 
     */
    constructor(context, name)
    {
        super(context, name, ResourceType.Texture);

        this.level          = 0;
        this.width          = 1;
        this.height         = 1;
        this.border         = 0;
        this.internalFormat = context.gl.RGBA32F;
        this.sourceFormat   = context.gl.RGBA;
        this.sourceType     = context.gl.FLOAT;
        this.data           = [];
        this.generateMips   = false;
        this.glTexture      = context.gl.createTexture();
    }

    build()
    {
        let pixels = null;
        let pixelDataLength = this.width * this.height * this._getPixelDepth();

        switch(this.sourceType)
        {
            case this.context.gl.UNSIGNED_BYTE:
                pixels = new Uint8Array(pixelDataLength);
                break;

            case this.context.gl.UNSIGNED_SHORT_5_6_5:
            case this.context.gl.UNSIGNED_SHORT_4_4_4_4:
            case this.context.gl.UNSIGNED_SHORT_5_5_5_1:
            case this.context.gl.UNSIGNED_SHORT:
                pixels = new Uint16Array(pixelDataLength);
                break;

            case this.context.gl.UNSIGNED_INT:
            case this.context.gl.UNSIGNED_INT_24_8_WEBGL:
                pixels = new Uint32Array(pixelDataLength);
                break;

            case this.context.gl.FLOAT:
                pixels = new Float32Array(pixelDataLength);
                break;

            default:
                console.error("Unsupported source type");
                return;
        }

        let pixelIndex = 0;

        for(; (pixelIndex < this.data.length && pixelIndex < pixelDataLength); ++pixelIndex)
        {
            pixels[pixelIndex] = this.data[pixelIndex];
        }

        for(; pixelIndex < pixelDataLength; ++pixelIndex)
        {
            pixels[pixelIndex] = 0;
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
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_MAG_FILTER, this.context.gl.LINEAR);
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_MIN_FILTER, this.context.gl.LINEAR);
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_WRAP_S, this.context.gl.CLAMP_TO_EDGE);
            this.context.gl.texParameteri(this.context.gl.TEXTURE_2D, this.context.gl.TEXTURE_WRAP_T, this.context.gl.CLAMP_TO_EDGE);
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
        if((uniform === null) || (uniform == -1))
        {
            return;
        }
        
        this.context.gl.activeTexture(textureIndex);
        this.context.gl.bindTexture(this.context.gl.TEXTURE_2D, this.glTexture);
        this.context.gl.uniform1i(uniform, index);
    }

    _getPixelDepth()
    {
        switch(this.sourceFormat)
        {
            case this.context.gl.RGBA:
            case this.context.gl.RGBA32F:
                return 4;

            default:
                console.error("Unsupported pixel source format");
                return 0;
        }
    }
}
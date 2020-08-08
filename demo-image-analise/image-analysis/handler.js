'use strict';

const { get } = require('axios')

class Hander {

  constructor({ rekoSvc, translator }) {
    this.rekoSvc = rekoSvc
    this.translator = translator
  }

  async detecImageLables(buffer) {
    const result = await this.rekoSvc.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise()

    const workingItens = result.Labels.filter(({ Confidence}) => Confidence > 90)
    const names = workingItens.map(({ Name }) => Name).join(' and ')
    console.log(names)

    return { names, workingItens }
  }

  async translateText(text) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }

    const { TranslatedText } = await this.translator.translateText(params).promise() 
    return TranslatedText.split(' e ')
  }

  formatTextResults(texts, workingItens) {
    const finalText = []
    for(const index in texts) {
      const nameInPortugue = texts[index]
      const confidence = workingItens[index].Confidence
      finalText.push(
        `${confidence.toFixed(2)}% de ser do tipo ${nameInPortugue}`
      )
    }

    return finalText
  }

  async getImageBuffer(url) {
    const response = await get(url, {
      responseType: 'arraybuffer'
    })

    const buffer = Buffer.from(response.data, 'base64')
    return buffer
  }

  async main(event) {
    try {
      const { imageUrl } = event.queryStringParameters
      console.log('download image...', imageUrl)
      const buffer = await this.getImageBuffer(imageUrl)
      const { names, workingItens } = await this.detecImageLables(buffer)
      const namesTranslated = await this.translateText(names)
      const finalText = this.formatTextResults(namesTranslated, workingItens)
      
      return {
        statusCode: 200,
        body: `a imagem tem \n`.concat(finalText)
      }
    } catch (error) {
      console.log(`erro....`, error.stack)
      return {
        statusCode: 500,
        body: 'Internal server error'
      }
    }
  }
}

const aws = require('aws-sdk')
const reko = new aws.Rekognition()
const translator = new aws.Translate()
const handler = new Hander({
  rekoSvc: reko,
  translator: translator
})
module.exports.main = handler.main.bind(handler)

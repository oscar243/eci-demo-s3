# eci-demo-s3

Contexto aplicacion:

Se crea un frontend estatico que se usara para suir archivos a s3

El proceso de subida es:

Solicitar a api gateway link estatico, el api gateway usa un lambda para generar el link par ahacer la subida, se sube el archivo

Hay una funcion lambda que hace la conversion del audio subido a texto y lo pasa por un llm, el audio dee ser de menos de 20 megas. Los resultados se guardan en s3.


Ajustar el cors del api
# lof.js
基于密度的离群点检测算法的javascript版本

基于这个python版本翻译的 https://github.com/wangyibo360/pylof

调用outliers函数，传入一个必传参数，一个二维数组；一个可选参数，默认为5

暂时只支持二维点，适用于地图上经纬度点的离群点检测这类情景。

ex:
 ```
 const outliers = require('lof');
 let points = [
  [35.45454, 116.4534534],
  [35.65776, 116.3557876],
  [35.16457, 116.4787889],
  [35.23456, 116.3123435]
 ]
 const res = outliers(points);
 ```

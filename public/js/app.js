angular.module("mangasApp", ['ngRoute', 'ui.bootstrap', 'angular-loading-bar', 'ngAnimate'])
    .config(function ($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "views/list.html",
                controller: "ListController",
                resolve: {
                    mangas: function (Mangas) {
                        return Mangas.getMangas();
                    }
                }
            })
            .when("/manga/:id", {
                controller: "MangaController",
                templateUrl: "views/manga.html"
            })
            .when("/read/:id", {
                controller: "ReadController",
                templateUrl: "views/read.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("Mangas", function ($http) {
        this.getMangas = function () {
            return $http.get("/api/mangas").then(function (response) {
                return response;
            }, function (response) {
                alert("Error finding mangas.");
            });
        }
        this.searchManga = function (p) {
            var url = "/api/mangas/search/" + p;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                alert("Error searching mangas.");
            });
        }
        this.getManga = function (id) {
            var url = "/api/mangas/" + id;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                alert("Error getting manga.");
            });
        }
        this.getChapter = function (chapterId) {
            var url = "/api/mangas/chapter/" + chapterId;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                alert("Error getting chapter.");
            });
        }
        this.currentManga = function () {
            var manga = {};

            return {
                getProperty: function () {
                    return manga;
                },
                setProperty: function (value) {
                    manga = value;
                }
            };
        }
    })
    .service('sharedProperties', function () {
        var objectValue = {};

        return {
            setObject: function (value) {
                objectValue = value;
            },
            getObject: function () {
                return objectValue;
            }
        }
    })
    .controller("ListController", function (Mangas, $scope) {
        //$scope.mangas = mangas.data;
        $scope.mangas = [];
        $scope.filteredMangas = [];
        $scope.totalItems = 0;
        $scope.currentPage = 0;

        $scope.search = function () {
            Mangas.searchManga($scope.searchKeyword).then(function (doc) {
                $scope.mangas = doc.data;
                $scope.filteredMangas = $scope.mangas.slice(0, 10);

                $scope.totalItems = $scope.mangas.length;
            }, function (response) {
                alert(response);
            });
        };

        $scope.pageChanged = function () {
            var begin = (($scope.currentPage - 1) * 10), end = begin + 10;
            $scope.filteredMangas = $scope.mangas.slice(begin, end);
        };
    })
    .controller("MangaController", function ($scope, $routeParams, Mangas, sharedProperties) {
        Mangas.getManga($routeParams.id).then(function (doc) {
            doc.data.id = $routeParams.id;
            $scope.manga = doc.data;
            sharedProperties.setObject(doc.data);
        }, function (response) {
            alert(response);
        });
    })
    .controller("ReadController", function ($scope, $routeParams, $location, Mangas, sharedProperties) {
        $scope.currentImage = "0";
        $scope.manga = sharedProperties.getObject();
        $scope.selectedChapterId = $routeParams.id;
        $scope.selectedChapterOrder = getChapterCount($scope.manga.chapters, $scope.selectedChapterId);

        Mangas.getChapter($routeParams.id).then(function (doc) {
            $scope.chapter = doc.data;
            $scope.totalImages = $scope.chapter.images.length -1;
        }, function (response) {
            alert(response);
        });

        $scope.nextImage = function () {
            if(parseInt($scope.currentImage) != $scope.totalImages)
                $scope.currentImage = (parseInt($scope.currentImage) + 1).toString();
            else
            {
                $scope.selectedChapterOrder--;
                $location.path("/read/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
            }
        };

        $scope.nextChapter = function () {
            $scope.selectedChapterOrder--;
            $location.path("/read/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
        };

        $scope.prevChapter = function () {
            $scope.selectedChapterOrder++;
            $location.path("/read/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
        };

        $scope.changeChapter = function () {
            $location.path("/read/" + $scope.selectedChapterId);
        };
    });

function getChapterCount(arr,id)
{
    for(var i = 0; i<arr.length; i++)
    {
        if(arr[i][3] == id)
            return i;
    }
}
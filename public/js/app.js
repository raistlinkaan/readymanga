angular.module("mangasApp", ['ngRoute', 'ngAnimate'])
    .factory('MangalistDto', function () {
        var MangalistDto = function (data) {
            angular.extend(this, {
                pageSize: 12,
                pageIndex: 1,
                total: 0,
                keyword: '',
                category: ''
            });
            angular.extend(this, data);
        }
        
        //delete MangalistDto.paging.list;
        return MangalistDto;
    })
    .config(function ($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "views/list.html",
                controller: "ListController",
                resolve: {
                    mangas: function (MangaService, MangalistDto) {
                        return MangaService.getMangaList(new MangalistDto());
                    }
                }
            })
            .when("/manga/:id", {
                controller: "MangaController",
                templateUrl: "views/manga.html"
            })
            .when("/read/:mangaid/:chapterid", {
                controller: "ReadController",
                templateUrl: "views/read.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("MangaService", function ($http) {
        this.getMangaList = function (paging) {
            return $http.post("/api/manga/list/", paging).then(function (response) {
                return response;
            }, function (response) {
                //alert("Error finding mangas.");
            });
        },
        this.getManga = function (id) {
            var url = "/api/manga/" + id;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                //alert("Error getting manga.");
            });
        },
        this.getChapter = function (chapterId) {
            var url = "/api/manga/chapter/" + chapterId;
            return $http.get(url).then(function (response) {
                return response;
            }, function (response) {
                //alert("Error getting chapter.");
            });
        }
    })
    .controller("ListController", function ($scope, MangaService, MangalistDto, mangas) {
        $scope.mangalist = htmlDecode(mangas.data.list);
        $scope.paging = new MangalistDto(mangas.data);
        delete $scope.paging.list;

        $scope.search = function () {
            $scope.paging.pageIndex = 1;
            MangaService.getMangaList($scope.paging).then(function (doc) {
                $scope.mangalist = htmlDecode(doc.data.list);
                $scope.paging = new MangalistDto(doc.data);
                delete $scope.paging.list;
            }, function (response) {
                //alert(response);
            });
        };

        $scope.numberOfPages = function(){
            return Math.ceil($scope.paging.total / $scope.paging.pageSize);                
        }

        $scope.pageChange = function (num) {
            $scope.paging.pageIndex += num;
            
            MangaService.getMangaList($scope.paging).then(function (doc) {
                $scope.mangalist = htmlDecode(doc.data.list);
                $scope.paging = new MangalistDto(doc.data);
                delete $scope.paging.list;
            }, function (response) {
                //alert(response);
            });
        };
    })
    .controller("MangaController", function ($scope, $routeParams, MangaService, $location) {
        MangaService.getManga($routeParams.id).then(function (doc) {
            doc.data.id = $routeParams.id;
            $scope.manga = doc.data;
            $scope.manga.description = he.unescape($scope.manga.description);
            $scope.manga.status = mangastatus[$scope.manga.status];
        }, function (response) {
            //alert(response);
        });

        $scope.detail = function(mangaid, chapterid){
            $location.path('/read/'+mangaid+'/'+chapterid+'');
        }
    })
    .controller("ReadController", function ($scope, $routeParams, $location, MangaService) {
        $scope.currentImage = "0";
        
        if($routeParams.chapterid && $routeParams.mangaid)
        {
            MangaService.getManga($routeParams.mangaid).then(function (doc) {
                $scope.manga = doc.data;
                $scope.selectedChapterId = $routeParams.chapterid;
                $scope.selectedChapterOrder = getChapterCount($scope.manga.chapters, $scope.selectedChapterId);

                MangaService.getChapter($routeParams.chapterid).then(function (doc) {
                    $scope.chapter = doc.data;
                    $scope.totalImages = $scope.chapter.images.length -1;
                }, function (response) {
                    //alert(response);
                });
            }, function (response) {
                //alert(response);
            });
        }

        $scope.nextImage = function () {
            if(parseInt($scope.currentImage) != $scope.totalImages)
                $scope.currentImage = (parseInt($scope.currentImage) + 1).toString();
            else
            {
                $scope.selectedChapterOrder--;
                $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
            }
        };

        $scope.nextChapter = function () {
            $scope.selectedChapterOrder--;
            $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
        };

        $scope.prevChapter = function () {
            $scope.selectedChapterOrder++;
            $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.manga.chapters[$scope.selectedChapterOrder][3]);
        };

        $scope.changeChapter = function () {
            $location.path("/read/"+ $routeParams.mangaid+ "/" + $scope.selectedChapterId);
        };
    });

function htmlDecode(arr)
{
    _.each(arr, function(item) {
        item.t = he.unescape(item.t);
    });

    return arr;
}
function getChapterCount(arr,id)
{
    for(var i = 0; i<arr.length; i++)
    {
        if(arr[i][3] == id)
            return i;
    }
}